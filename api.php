<?php
// Set proper headers for CORS and JSON response
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

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
    echo json_encode(['error' => 'Error creating table: ' . $conn->error]);
    exit;
}

session_start();

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Log received action
error_log("Received action: " . $action);

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
    default:
        echo json_encode(['error' => 'Invalid action']);
}

function registerUser($conn) {
    // Log registration attempt
    error_log("Registration attempt received");
    
    // Get POST data
    $username = isset($_POST['username']) ? $_POST['username'] : null;
    $password = isset($_POST['password']) ? $_POST['password'] : null;
    
    // Log received data (don't do this in production)
    error_log("Username: " . $username);
    error_log("Password received: " . ($password ? "Yes" : "No"));
    
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
    // Log login attempt
    error_log("Login attempt received");
    
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

    $nome_cliente = $_POST['nome'];
    $data = $_POST['data'];
    $ora = $_POST['ora'];
    $persone = $_POST['persone'];
    $contatto = $_POST['contatto'];
    $user_id = $_SESSION['user_id'];

    $sql = "INSERT INTO reservations (user_id, nome_cliente, data, ora, persone, contatto) VALUES ('$user_id', '$nome_cliente', '$data', '$ora', '$persone', '$contatto')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => 'Reservation created successfully']);
    } else {
        echo json_encode(['error' => 'Error creating reservation: ' . $conn->error]);
    }
}

function getReservations($conn) {
    if (!isset($_SESSION['user_id']) || $_SESSION['username'] !== 'admin') {
        echo json_encode(['error' => 'Unauthorized']);
        return;
    }

    $sql = "SELECT * FROM reservations";
    $result = $conn->query($sql);

    $reservations = [];
    while ($row = $result->fetch_assoc()) {
        $reservations[] = $row;
    }

    echo json_encode($reservations);
}

$conn->close();
?>