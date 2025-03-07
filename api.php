<?php
// filepath: /workspaces/RistoranteAPI/api.php
header('Content-Type: application/json');

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'ristorante';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

session_start();

$action = isset($_GET['action']) ? $_GET['action'] : '';

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
    $username = $_POST['username'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $sql = "INSERT INTO users (username, password) VALUES ('$username', '$password')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(['success' => 'User registered successfully']);
    } else {
        echo json_encode(['error' => 'Error registering user: ' . $conn->error]);
    }
}

function loginUser($conn) {
    $username = $_POST['username'];
    $password = $_POST['password'];

    $sql = "SELECT id, username, password FROM users WHERE username = '$username'";
    $result = $conn->query($sql);

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
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