<?php
// Set proper headers for CORS and JSON response
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// Enable error reporting for debugging (remove in production)
ini_set('display_errors', 1);
error_reporting(E_ALL);

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'ristorante';

// Create database connection
$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

// Create users table if not exists
$sql = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

if ($conn->query($sql) !== TRUE) {
    echo json_encode(['error' => 'Error creating users table: ' . $conn->error]);
    exit;
}

// Create reservations table if not exists
$sql = "CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nome_cliente VARCHAR(100) NOT NULL,
    data DATE NOT NULL,
    ora TIME NOT NULL,
    persone INT NOT NULL,
    contatto VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)";

if ($conn->query($sql) !== TRUE) {
    echo json_encode(['error' => 'Error creating reservations table: ' . $conn->error]);
}

session_start();

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Log received action
error_log("API action received: " . $action);

switch ($action) {
    case 'register':
        registerUser($conn);
        break;
    case 'login':
        loginUser($conn);
        break;
    case 'logout':
        logoutUser();
        break;
    case 'create_reservation':
        createReservation($conn);
        break;
    case 'get_reservations':
        getReservations($conn);
        break;
    case 'get_user_reservations':
        getUserReservations($conn);
        break;
    case 'get_reservation':
        getReservationById($conn);
        break;
    case 'update_reservation':
        updateReservation($conn);
        break;
    case 'delete_reservation':
        deleteReservation($conn);
        break;
    default:
        echo json_encode(['error' => 'Invalid action']);
}

function registerUser($conn) {
    // Get POST data
    $username = isset($_POST['username']) ? $_POST['username'] : null;
    $password = isset($_POST['password']) ? $_POST['password'] : null;
    
    if (!$username || !$password) {
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    // Check username length
    if (strlen($username) < 3) {
        echo json_encode(['error' => 'Username must be at least 3 characters']);
        return;
    }
    
    // Check password length
    if (strlen($password) < 6) {
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        return;
    }
    
    // Check if username already exists - use prepared statement
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode(['error' => 'Username already exists']);
        $stmt->close();
        return;
    }
    $stmt->close();
    
    // Hash password and insert user - use prepared statement
    $hashed = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $conn->prepare("INSERT INTO users (username, password) VALUES (?, ?)");
    $stmt->bind_param("ss", $username, $hashed);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => 'Registration successful']);
    } else {
        echo json_encode(['error' => 'Error: ' . $stmt->error]);
    }
    
    $stmt->close();
}

function loginUser($conn) {
    $username = isset($_POST['username']) ? $_POST['username'] : null;
    $password = isset($_POST['password']) ? $_POST['password'] : null;
    
    if (!$username || !$password) {
        echo json_encode(['error' => 'Missing username or password']);
        return;
    }
    
    // Get user by username - use prepared statement
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        
        // Verify password using modern password_verify
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            echo json_encode(['success' => 'Login successful', 'username' => $user['username']]);
        } else {
            echo json_encode(['error' => 'Invalid password']);
        }
    } else {
        echo json_encode(['error' => 'User not found']);
    }
    
    $stmt->close();
}

function logoutUser() {
    session_destroy();
    echo json_encode(['success' => 'Logout successful']);
}

function createReservation($conn) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'User not logged in']);
        return;
    }

    $nome_cliente = $_POST['nome'] ?? '';
    $data = $_POST['data'] ?? '';
    $ora = $_POST['ora'] ?? '';
    $persone = isset($_POST['persone']) ? intval($_POST['persone']) : 0;
    $contatto = $_POST['contatto'] ?? '';
    $user_id = $_SESSION['user_id'];

    // Validate inputs
    if (empty($nome_cliente) || empty($data) || empty($ora) || empty($contatto) || $persone < 1) {
        echo json_encode(['error' => 'All fields are required']);
        return;
    }

    // Use prepared statement
    $stmt = $conn->prepare("INSERT INTO reservations (user_id, nome_cliente, data, ora, persone, contatto) 
                          VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssis", $user_id, $nome_cliente, $data, $ora, $persone, $contatto);

    if ($stmt->execute()) {
        echo json_encode(['success' => 'Reservation created successfully']);
    } else {
        echo json_encode(['error' => 'Error creating reservation: ' . $stmt->error]);
    }

    $stmt->close();
}

function getReservations($conn) {
    // Admin only endpoint
    if (!isset($_SESSION['user_id']) || $_SESSION['username'] !== 'admin') {
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }

    $sql = "SELECT * FROM reservations ORDER BY data ASC, ora ASC";
    $result = $conn->query($sql);

    $reservations = [];
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            $reservations[] = $row;
        }
    }

    echo json_encode($reservations);
}

function getUserReservations($conn) {
    // Must be logged in
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'User not logged in']);
        return;
    }

    $user_id = $_SESSION['user_id'];
    
    $stmt = $conn->prepare("SELECT * FROM reservations WHERE user_id = ? ORDER BY data ASC, ora ASC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = $row;
    }

    echo json_encode($reservations);
    $stmt->close();
}

function getReservationById($conn) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'User not logged in']);
        return;
    }

    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    // Admin can see all reservations, users can only see their own
    if ($_SESSION['username'] === 'admin') {
        $stmt = $conn->prepare("SELECT * FROM reservations WHERE id = ?");
        $stmt->bind_param("i", $id);
    } else {
        $user_id = $_SESSION['user_id'];
        $stmt = $conn->prepare("SELECT * FROM reservations WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $id, $user_id);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode($result->fetch_assoc());
    } else {
        echo json_encode(['error' => 'Reservation not found']);
    }
    
    $stmt->close();
}

function updateReservation($conn) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'User not logged in']);
        return;
    }
    
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    $nome_cliente = $_POST['nome_cliente'] ?? '';
    $data = $_POST['data'] ?? '';
    $ora = $_POST['ora'] ?? '';
    $persone = isset($_POST['persone']) ? intval($_POST['persone']) : 0;
    $contatto = $_POST['contatto'] ?? '';
    
    // Check if the user is admin or the owner of the reservation
    if ($_SESSION['username'] === 'admin') {
        $stmt = $conn->prepare("UPDATE reservations SET nome_cliente = ?, data = ?, 
                              ora = ?, persone = ?, contatto = ? WHERE id = ?");
        $stmt->bind_param("sssisi", $nome_cliente, $data, $ora, $persone, $contatto, $id);
    } else {
        $user_id = $_SESSION['user_id'];
        $stmt = $conn->prepare("UPDATE reservations SET nome_cliente = ?, data = ?, 
                              ora = ?, persone = ?, contatto = ? 
                              WHERE id = ? AND user_id = ?");
        $stmt->bind_param("sssisii", $nome_cliente, $data, $ora, $persone, $contatto, $id, $user_id);
    }
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => 'Reservation updated successfully']);
        } else {
            echo json_encode(['error' => 'No changes made or unauthorized']);
        }
    } else {
        echo json_encode(['error' => 'Error updating reservation: ' . $stmt->error]);
    }
    
    $stmt->close();
}

function deleteReservation($conn) {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['error' => 'User not logged in']);
        return;
    }
    
    $id = isset($_POST['id']) ? intval($_POST['id']) : 0;
    
    // Check if the user is admin or the owner of the reservation
    if ($_SESSION['username'] === 'admin') {
        $stmt = $conn->prepare("DELETE FROM reservations WHERE id = ?");
        $stmt->bind_param("i", $id);
    } else {
        $user_id = $_SESSION['user_id'];
        $stmt = $conn->prepare("DELETE FROM reservations WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $id, $user_id);
    }
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode(['success' => 'Reservation deleted successfully']);
        } else {
            echo json_encode(['error' => 'Reservation not found or unauthorized']);
        }
    } else {
        echo json_encode(['error' => 'Error deleting reservation: ' . $stmt->error]);
    }
    
    $stmt->close();
}

$conn->close();
?>