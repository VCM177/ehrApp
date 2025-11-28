// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MediChain {
    struct EHRRecord {
        bytes32 dataHash;
        string offChainAddress;
        uint256 timestamp;
        string fileName; // THÊM MỚI: Để hiển thị tên file cho dễ nhìn
    }

    struct AccessGrant {
        bytes encryptedSymmetricKey;
        uint256 grantTimestamp;
        bool revoked;
    }

    // THAY ĐỔI QUAN TRỌNG: Lưu trữ một MẢNG các bản ghi cho mỗi bệnh nhân
    mapping(address => EHRRecord[]) private patientRecords;

    mapping(address => mapping(address => AccessGrant)) public patientAccessGrants;

    // Event cập nhật thêm fileName và recordId
    event EHRRegistered(address indexed patient, uint256 recordId, string fileName, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed receiver, uint256 timestamp);
    event AccessRevoked(address indexed patient, address indexed receiver, uint256 timestamp);

    // Hàm: Đăng ký thêm hồ sơ mới (PUSH vào mảng)
    function registerEHR(bytes32 _dataHash, string memory _offChainAddress, string memory _fileName) public {
        EHRRecord memory newRecord = EHRRecord({
            dataHash: _dataHash,
            offChainAddress: _offChainAddress,
            timestamp: block.timestamp,
            fileName: _fileName
        });

        // Thêm vào cuối mảng của người gọi
        patientRecords[msg.sender].push(newRecord);
        uint256 newRecordId = patientRecords[msg.sender].length - 1;

        emit EHRRegistered(msg.sender, newRecordId, _fileName, block.timestamp);
    }

    // Hàm: Cấp quyền (Không đổi)
    function grantAccess(address _receiver, bytes memory _encryptedSymmetricKey) public {
        require(_receiver != address(0), "Invalid receiver.");
        require(_receiver != msg.sender, "Cannot grant to self.");

        patientAccessGrants[msg.sender][_receiver] = AccessGrant({
            encryptedSymmetricKey: _encryptedSymmetricKey,
            grantTimestamp: block.timestamp,
            revoked: false
        });
        emit AccessGranted(msg.sender, _receiver, block.timestamp);
    }

    // Hàm: Thu hồi quyền (Không đổi)
    function revokeAccess(address _receiver) public {
        require(patientAccessGrants[msg.sender][_receiver].grantTimestamp != 0, "No active grant.");
        patientAccessGrants[msg.sender][_receiver].revoked = true;
        emit AccessRevoked(msg.sender, _receiver, block.timestamp);
    }

    // --- CÁC HÀM TRUY VẤN MỚI ĐỂ HỖ TRỢ DANH SÁCH ---

    // Hàm phụ trợ kiểm tra quyền
    function hasAccess(address _patient, address _viewer) internal view returns (bool) {
        if (_patient == _viewer) return true; // Chính chủ được xem của mình
        AccessGrant memory grant = patientAccessGrants[_patient][_viewer];
        return (grant.grantTimestamp != 0 && !grant.revoked);
    }

    // 1. Lấy tổng số lượng hồ sơ của một bệnh nhân
    function getRecordCount(address _patientAddress) public view returns (uint256) {
        require(hasAccess(_patientAddress, msg.sender), "Access denied.");
        return patientRecords[_patientAddress].length;
    }

    // 2. Lấy thông tin một hồ sơ cụ thể theo chỉ mục (index)
    function getRecordByIndex(address _patientAddress, uint256 _index) public view returns (bytes32, string memory, uint256, string memory) {
        require(hasAccess(_patientAddress, msg.sender), "Access denied.");
        require(_index < patientRecords[_patientAddress].length, "Invalid index.");

        EHRRecord memory record = patientRecords[_patientAddress][_index];
        // Trả về dạng tuple
        return (record.dataHash, record.offChainAddress, record.timestamp, record.fileName);
    }

    // Hàm lấy Key đã mã hóa (Không đổi)
    function getEncryptedSymmetricKey(address _patientAddress) public view returns (bytes memory) {
        AccessGrant memory grant = patientAccessGrants[_patientAddress][msg.sender];
        require(grant.grantTimestamp != 0 && !grant.revoked, "Access denied.");
        return grant.encryptedSymmetricKey;
    }
}