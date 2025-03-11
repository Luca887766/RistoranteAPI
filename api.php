<?php
// HEADERS & CONFIGURATION
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

ini_set('display_errors', 1);
error_reporting(E_ALL);

// DATABASE CONNECTION
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';
$db_name = 'ristorante';

$conn = new mysqli($db_host, $db_user, $db_pass, $db_name);

if ($conn->connect_error) {
    die(json_encode(['error' => 'Database connection failed: ' . $conn->connect_error]));
}

session_start();

// REQUEST ROUTING
$action = isset($_GET['action']) ? $_GET['action'] : '';
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
    case 'check_date_availability':
        checkDateAvailability($conn);
        break;
    case 'check_date_range_availability':
        checkDateRangeAvailability($conn);
        break;
    case 'check_timeslot_availability':
        checkTimeSlotAvailability($conn);
        break;
    default:
        echo json_encode(['error' => 'Invalid action']);
}

// AUTH FUNCTIONS
function registerUser($conn) {
    $username = isset($_POST['username']) ? $_POST['username'] : null;
    $password = isset($_POST['password']) ? $_POST['password'] : null;
    
    if (!$username || !$password) {
        echo json_encode(['error' => 'Missing required fields']);
        return;
    }
    
    if (strlen($username) < 3) {
        echo json_encode(['error' => 'Username must be at least 3 characters']);
        return;
    }
    
    if (strlen($password) < 6) {
        echo json_encode(['error' => 'Password must be at least 6 characters']);
        return;
    }
    
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
    
    $stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
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
    
    $stmt->close();
}

function logoutUser() {
    session_destroy();
    echo json_encode(['success' => 'Logout successful']);
}

// RESERVATION FUNCTIONS
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

    if (empty($nome_cliente) || empty($data) || empty($ora) || empty($contatto) || $persone < 1) {
        echo json_encode(['error' => 'All fields are required']);
        return;
    }
    
    $allowedTimeSlots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    if (!in_array($ora, $allowedTimeSlots)) {
        echo json_encode(['error' => 'Orario non valido. Scegli un orario tra quelli disponibili.']);
        return;
    }
    
    $today = date('Y-m-d');
    if ($data < $today) {
        echo json_encode(['error' => 'Non è possibile prenotare per date passate']);
        return;
    }
    
    // Check if there's enough space during this time slot
    $bookingStart = $ora;
    $bookingEnd = date('H:i', strtotime($ora) + 5400);
    
    $stmt = $conn->prepare("
        SELECT SUM(persone) as total FROM reservations 
        WHERE data = ? AND (
            -- Existing reservation starts during our booking
            (ora >= ? AND ora < ?) OR
            -- Existing reservation ends during our booking
            (ADDTIME(ora, '01:30:00') > ? AND ADDTIME(ora, '01:30:00') <= ?) OR
            -- Existing reservation completely overlaps our booking
            (ora <= ? AND ADDTIME(ora, '01:30:00') >= ?)
        )
    ");
    $stmt->bind_param("sssssss", $data, $bookingStart, $bookingEnd, $bookingStart, $bookingEnd, $bookingStart, $bookingEnd);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $currentOccupancy = $row['total'] ? (int)$row['total'] : 0;
    $stmt->close();
    
    $maxCapacity = 50;
    
    if ($currentOccupancy + $persone > $maxCapacity) {
        echo json_encode(['error' => 'Non c\'è disponibilità per questo orario e numero di persone']);
        return;
    }

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

// AVAILABILITY CHECK FUNCTIONS
function checkDateAvailability($conn) {
    $date = isset($_GET['date']) ? $_GET['date'] : '';
    
    if (empty($date)) {
        echo json_encode(['error' => 'Data non specificata']);
        return;
    }
    
    $today = date('Y-m-d');
    if ($date < $today) {
        echo json_encode(['error' => 'Non è possibile prenotare per date passate']);
        return;
    }
    
    // Get all time slots for the restaurant (from 19:00 to 22:00)
    $timeSlots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    $maxCapacity = 50; // Restaurant capacity
    
    // Check each time slot separately to find if any is fully available
    $availableSlots = [];
    
    foreach ($timeSlots as $timeSlot) {
        // Get reservations that overlap with this time slot
        $stmt = $conn->prepare("
            SELECT SUM(persone) as total FROM reservations 
            WHERE data = ? AND (
                (ora <= ? AND ADDTIME(ora, '01:30:00') > ?) OR
                (ora < ADDTIME(?, '01:30:00') AND ora >= ?)
            )
        ");
        $endTime = date('H:i', strtotime($timeSlot) + 5400); // 1.5 hours = 5400 seconds
        $stmt->bind_param("sssss", $date, $timeSlot, $endTime, $timeSlot, $timeSlot);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $occupancy = $row['total'] ? (int)$row['total'] : 0;
        $stmt->close();
        
        $availableSlots[$timeSlot] = $maxCapacity - $occupancy;
    }
    
    // If all time slots are fully booked, return not available
    $allFull = true;
    foreach ($availableSlots as $available) {
        if ($available > 0) {
            $allFull = false;
            break;
        }
    }
    
    if ($allFull) {
        echo json_encode(['available' => false]);
    } else {
        echo json_encode([
            'available' => true, 
            'availableSlots' => $availableSlots
        ]);
    }
}

function checkDateRangeAvailability($conn) {
    $startDate = isset($_GET['start']) ? $_GET['start'] : '';
    $endDate = isset($_GET['end']) ? $_GET['end'] : '';
    
    if (empty($startDate) || empty($endDate)) {
        echo json_encode(['error' => 'Date di inizio e fine non specificate']);
        return;
    }
    
    $today = date('Y-m-d');
    if ($startDate < $today) {
        $startDate = $today;
    }
    
    // Get all dates in the range
    $dateRange = [];
    $current = new DateTime($startDate);
    $end = new DateTime($endDate);
    $end->modify('+1 day'); // Include the end date
    
    $interval = new DateInterval('P1D');
    $dateRange = new DatePeriod($current, $interval, $end);
    
    // Get all time slots for the restaurant
    $timeSlots = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'];
    $maxCapacity = 50; // Restaurant capacity
    
    $fullyBookedDates = [];
    $dateAvailability = [];
    
    // Check each date in the range
    foreach ($dateRange as $date) {
        $formattedDate = $date->format('Y-m-d');
        $isFullyBooked = true;
        
        // Check each time slot for this date
        foreach ($timeSlots as $timeSlot) {
            // Get reservations that overlap with this time slot
            $stmt = $conn->prepare("
                SELECT SUM(persone) as total FROM reservations 
                WHERE data = ? AND (
                    (ora <= ? AND ADDTIME(ora, '01:30:00') > ?) OR
                    (ora < ADDTIME(?, '01:30:00') AND ora >= ?)
                )
            ");
            $endTime = date('H:i', strtotime($timeSlot) + 5400); // 1.5 hours = 5400 seconds
            $stmt->bind_param("sssss", $formattedDate, $timeSlot, $endTime, $timeSlot, $timeSlot);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            $occupancy = $row['total'] ? (int)$row['total'] : 0;
            $stmt->close();
            
            // If at least one time slot has space, the date is not fully booked
            if ($occupancy < $maxCapacity) {
                $isFullyBooked = false;
                break;
            }
        }
        
        if ($isFullyBooked) {
            $fullyBookedDates[] = $formattedDate;
            $dateAvailability[$formattedDate] = false;
        } else {
            $dateAvailability[$formattedDate] = true;
        }
    }
    
    echo json_encode([
        'success' => true,
        'fullyBookedDates' => $fullyBookedDates,
        'dateAvailability' => $dateAvailability
    ]);
}

function checkTimeSlotAvailability($conn) {
    $date = isset($_GET['date']) ? $_GET['date'] : '';
    $time = isset($_GET['time']) ? $_GET['time'] : '';
    $persone = isset($_GET['persone']) ? (int)$_GET['persone'] : 0;
    
    if (empty($date) || empty($time)) {
        echo json_encode(['error' => 'Data o orario non specificati']);
        return;
    }
    
    if ($persone <= 0) {
        echo json_encode(['error' => 'Numero di persone non valido']);
        return;
    }
    
    // Get all reservations that would overlap with the requested time slot
    $bookingStart = $time;
    $bookingEnd = date('H:i', strtotime($time) + 5400);
    
    $stmt = $conn->prepare("
        SELECT SUM(persone) as total FROM reservations 
        WHERE data = ? AND (
            -- Existing reservation starts during our booking
            (ora >= ? AND ora < ?) OR
            -- Existing reservation ends during our booking
            (ADDTIME(ora, '01:30:00') > ? AND ADDTIME(ora, '01:30:00') <= ?) OR
            -- Existing reservation completely overlaps our booking
            (ora <= ? AND ADDTIME(ora, '01:30:00') >= ?)
        )
    ");
    $stmt->bind_param("sssssss", $date, $bookingStart, $bookingEnd, $bookingStart, $bookingEnd, $bookingStart, $bookingEnd);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $currentOccupancy = $row['total'] ? (int)$row['total'] : 0;
    $stmt->close();
    
    $maxCapacity = 50; // Restaurant capacity
    
    if ($currentOccupancy + $persone > $maxCapacity) {
        echo json_encode([
            'available' => false, 
            'error' => 'Non c\'è disponibilità per questo orario',
            'currentOccupancy' => $currentOccupancy,
            'requestedSeats' => $persone
        ]);
    } else {
        echo json_encode([
            'available' => true, 
            'remaining' => $maxCapacity - $currentOccupancy - $persone,
            'currentOccupancy' => $currentOccupancy
        ]);
    }
}

$conn->close();
?>