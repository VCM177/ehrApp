// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EHR_Certify
 * @dev This contract manages Electronic Health Records (EHRs) using a role-based access control system.
 * It defines three roles:
 * - ADMIN_ROLE: Manages doctors and system settings.
 * - DOCTOR_ROLE: Can be granted access to patient records and can add new records for patients.
 * - PATIENT_ROLE: Owns their records and manages access permissions.
 */
contract EHR_Certify is AccessControl {

    // --- Roles ---
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");

    // --- Structs ---
    struct Profile {
        bytes32 hash; // Hash of off-chain profile data (name, specialty, etc.)
        bool isSet;
    }

    struct Record {
        bytes32 recordHash;
        string fileName;
        uint256 timestamp;
    }

    struct AccessGrant {
        bool hasAccess;
        uint8 accessLevel; // 1: Read, 2: Read/Write
        uint256 expiryTime; // 0 for indefinite
    }

    // --- State Variables ---
    mapping(address => Profile) public userProfiles;
    mapping(address => Record[]) public patientRecords;
    mapping(bytes32 => address) public recordOwner;

    // Mapping for access control: Patient Address => Doctor Address => AccessGrant
    mapping(address => mapping(address => AccessGrant)) public accessPermissions;

    // --- Events ---
    event UserRegistered(address indexed user, bytes32 indexed role);
    event RecordAdded(address indexed patient, bytes32 recordHash, string fileName);
    event AccessGranted(address indexed patient, address indexed doctor, uint8 accessLevel, uint256 expiry);
    event AccessRevoked(address indexed patient, address indexed doctor);

    // --- Constructor ---
    constructor() {
        // The account that deploys the contract gets the ADMIN_ROLE
        _setupRole(ADMIN_ROLE, msg.sender);
        // The deployer also has default patient and doctor roles for convenience
        _setupRole(PATIENT_ROLE, msg.sender);
        _setupRole(DOCTOR_ROLE, msg.sender);
        userProfiles[msg.sender] = Profile(keccak256("Initial Admin Profile"), true);
    }

    // --- Registration Functions ---

    /**
     * @notice Register the caller as a patient.
     * @param _profileHash Hash of the patient's off-chain profile data.
     */
    function registerAsPatient(bytes32 _profileHash) public {
        require(!hasRole(PATIENT_ROLE, msg.sender), "Patient role already granted");
        _grantRole(PATIENT_ROLE, msg.sender);
        userProfiles[msg.sender] = Profile(_profileHash, true);
        emit UserRegistered(msg.sender, PATIENT_ROLE);
    }

    /**
     * @notice Admin adds a new doctor to the system.
     * @param _doctorAddress The address of the doctor to add.
     * @param _profileHash Hash of the doctor's off-chain profile data.
     */
    function addDoctor(address _doctorAddress, bytes32 _profileHash) public onlyRole(ADMIN_ROLE) {
        require(!hasRole(DOCTOR_ROLE, _doctorAddress), "Doctor role already granted");
        _grantRole(DOCTOR_ROLE, _doctorAddress);
        userProfiles[_doctorAddress] = Profile(_profileHash, true);
        emit UserRegistered(_doctorAddress, DOCTOR_ROLE);
    }
    
    /**
     * @notice Admin revokes a doctor's role.
     * @param _doctorAddress The address of the doctor to revoke.
     */
    function revokeDoctor(address _doctorAddress) public onlyRole(ADMIN_ROLE) {
        require(hasRole(DOCTOR_ROLE, _doctorAddress), "Not a doctor");
        _revokeRole(DOCTOR_ROLE, _doctorAddress);
    }


    // --- Patient Functions ---

    /**
     * @notice A patient uploads a new health record.
     * @param _recordHash The hash of the record file.
     * @param _fileName The name of the record file.
     */
    function uploadRecord(bytes32 _recordHash, string memory _fileName) public onlyRole(PATIENT_ROLE) {
        require(recordOwner[_recordHash] == address(0), "Record hash already exists");
        
        patientRecords[msg.sender].push(Record(_recordHash, _fileName, block.timestamp));
        recordOwner[_recordHash] = msg.sender;
        
        emit RecordAdded(msg.sender, _recordHash, _fileName);
    }

    /**
     * @notice A patient grants access to a doctor.
     * @param _doctorAddress The doctor's address.
     * @param _accessLevel 1 for Read-Only, 2 for Read/Write.
     * @param _durationSeconds The duration of the grant in seconds (0 for indefinite).
     */
    function grantAccess(address _doctorAddress, uint8 _accessLevel, uint256 _durationSeconds) public onlyRole(PATIENT_ROLE) {
        require(hasRole(DOCTOR_ROLE, _doctorAddress), "Target address is not a doctor");
        require(_accessLevel == 1 || _accessLevel == 2, "Invalid access level");

        uint256 expiry = (_durationSeconds == 0) ? 0 : block.timestamp + _durationSeconds;
        
        accessPermissions[msg.sender][_doctorAddress] = AccessGrant(true, _accessLevel, expiry);
        
        emit AccessGranted(msg.sender, _doctorAddress, _accessLevel, expiry);
    }

    /**
     * @notice A patient revokes a doctor's access.
     * @param _doctorAddress The doctor's address.
     */
    function revokeAccess(address _doctorAddress) public onlyRole(PATIENT_ROLE) {
        require(accessPermissions[msg.sender][_doctorAddress].hasAccess, "Access not granted");
        
        delete accessPermissions[msg.sender][_doctorAddress];
        
        emit AccessRevoked(msg.sender, _doctorAddress);
    }

    // --- Doctor Functions ---

    /**
     * @notice A doctor adds a new health record for a patient.
     * @param _patientAddress The patient's address.
     * @param _recordHash The hash of the record file.
     * @param _fileName The name of the record file.
     */
    function addRecordForPatient(address _patientAddress, bytes32 _recordHash, string memory _fileName) public onlyRole(DOCTOR_ROLE) {
        require(checkAccess(_patientAddress, msg.sender) == 2, "Doctor does not have write access");
        require(recordOwner[_recordHash] == address(0), "Record hash already exists");

        patientRecords[_patientAddress].push(Record(_recordHash, _fileName, block.timestamp));
        recordOwner[_recordHash] = _patientAddress;

        emit RecordAdded(_patientAddress, _recordHash, _fileName);
    }

    // --- View Functions ---

    /**
     * @notice Checks the access level a doctor has for a patient.
     * @param _patientAddress The patient's address.
     * @param _doctorAddress The doctor's address.
     * @return accessLevel 0: No Access, 1: Read, 2: Read/Write.
     */
    function checkAccess(address _patientAddress, address _doctorAddress) public view returns (uint8) {
        AccessGrant memory grantInfo = accessPermissions[_patientAddress][_doctorAddress];
        if (!grantInfo.hasAccess) {
            return 0;
        }
        if (grantInfo.expiryTime != 0 && block.timestamp > grantInfo.expiryTime) {
            return 0; // Access expired
        }
        return grantInfo.accessLevel;
    }

    /**
     * @notice Get the list of record hashes for a given patient.
     * @param _patientAddress The address of the patient.
     * @return An array of Record structs.
     */
    function getPatientRecords(address _patientAddress) public view returns (Record[] memory) {
        // Anyone can see the number of records, but only authorized can see the content
        if (msg.sender != _patientAddress && checkAccess(_patientAddress, msg.sender) == 0) {
            // Revert if not the patient or an authorized doctor
            require(false, "Access denied");
        }
        return patientRecords[_patientAddress];
    }
    
    /**
     * @notice Get a user's profile hash.
     * @param _userAddress The address of the user.
     * @return The profile hash and whether it is set.
     */
    function getProfile(address _userAddress) public view returns (bytes32, bool) {
        Profile memory profile = userProfiles[_userAddress];
        return (profile.hash, profile.isSet);
    }
}
