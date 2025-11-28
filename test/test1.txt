// Import necessary components from Truffle
const EHR_Certify = artifacts.require("EHR_Certify");
const { expectRevert, time } = require('@openzeppelin/test-helpers');
const Web3 = require('web3');
const web3 = new Web3();

contract("EHR_Certify", (accounts) => {

    // Define accounts for roles for better readability
    const admin = accounts[0];
    const patient1 = accounts[1];
    const doctor1 = accounts[2];
    const stranger = accounts[3];
    const patient2 = accounts[4];

    // Define profile and record hashes for testing
    const patientProfileHash = web3.utils.sha3("Patient Profile Data");
    const doctorProfileHash = web3.utils.sha3("Doctor Profile Data");
    const recordHash1 = web3.utils.sha3("Medical Record 1");
    const recordFileName1 = "record1.pdf";

    let contractInstance;

    // --- Setup ---
    // Deploy a fresh contract instance before each test
    beforeEach(async () => {
        contractInstance = await EHR_Certify.new({ from: admin });
    });

    // --- Test Suite ---

    // 1. Deployment and Roles
    describe("Deployment and Role Setup", () => {
        it("should assign ADMIN_ROLE to the deployer", async () => {
            const hasAdminRole = await contractInstance.hasRole(await contractInstance.ADMIN_ROLE(), admin);
            assert.isTrue(hasAdminRole, "Deployer does not have ADMIN_ROLE.");
        });

        it("should allow a user to register as a patient", async () => {
            await contractInstance.registerAsPatient(patientProfileHash, { from: patient1 });
            const hasPatientRole = await contractInstance.hasRole(await contractInstance.PATIENT_ROLE(), patient1);
            assert.isTrue(hasPatientRole, "User failed to register as a patient.");
            
            const profile = await contractInstance.getProfile(patient1);
            assert.equal(profile[0], patientProfileHash, "Patient profile hash not set correctly.");
        });

        it("should allow an admin to add and revoke a doctor", async () => {
            // Add doctor
            await contractInstance.addDoctor(doctor1, doctorProfileHash, { from: admin });
            let hasDoctorRole = await contractInstance.hasRole(await contractInstance.DOCTOR_ROLE(), doctor1);
            assert.isTrue(hasDoctorRole, "Admin failed to add doctor.");
            
            const profile = await contractInstance.getProfile(doctor1);
            assert.equal(profile[0], doctorProfileHash, "Doctor profile hash not set correctly.");

            // Revoke doctor
            await contractInstance.revokeDoctor(doctor1, { from: admin });
            hasDoctorRole = await contractInstance.hasRole(await contractInstance.DOCTOR_ROLE(), doctor1);
            assert.isFalse(hasDoctorRole, "Admin failed to revoke doctor.");
        });
    });

    // 2. Patient Record Management
    describe("Patient Record Management", () => {
        beforeEach(async () => {
            // Pre-register a patient for these tests
            await contractInstance.registerAsPatient(patientProfileHash, { from: patient1 });
        });

        it("should allow a patient to upload a record", async () => {
            await contractInstance.uploadRecord(recordHash1, recordFileName1, { from: patient1 });
            const records = await contractInstance.getPatientRecords(patient1, { from: patient1 });
            assert.equal(records.length, 1, "Record count should be 1.");
            assert.equal(records[0].recordHash, recordHash1, "Record hash does not match.");
        });

        it("should prevent uploading a record with an existing hash", async () => {
            await contractInstance.uploadRecord(recordHash1, recordFileName1, { from: patient1 });
            await expectRevert(
                contractInstance.uploadRecord(recordHash1, "anotherfile.pdf", { from: patient1 }),
                "Record hash already exists"
            );
        });
    });

    // 3. Access Control
    describe("Access Control", () => {
        beforeEach(async () => {
            // Pre-register patient and doctor
            await contractInstance.registerAsPatient(patientProfileHash, { from: patient1 });
            await contractInstance.addDoctor(doctor1, doctorProfileHash, { from: admin });
            await contractInstance.uploadRecord(recordHash1, recordFileName1, { from: patient1 });
        });

        it("should allow a patient to grant and revoke access", async () => {
            // Grant read-only access
            await contractInstance.grantAccess(doctor1, 1, 0, { from: patient1 });
            let accessLevel = await contractInstance.checkAccess(patient1, doctor1);
            assert.equal(accessLevel, 1, "Doctor should have read access (1).");

            // Revoke access
            await contractInstance.revokeAccess(doctor1, { from: patient1 });
            accessLevel = await contractInstance.checkAccess(patient1, doctor1);
            assert.equal(accessLevel, 0, "Access should be revoked (0).");
        });

        it("should respect access levels (Read vs. Write)", async () => {
            // Grant read-only access (1)
            await contractInstance.grantAccess(doctor1, 1, 0, { from: patient1 });
            // Doctor tries to add a record for the patient (requires write access 2)
            await expectRevert(
                contractInstance.addRecordForPatient(patient1, web3.utils.sha3("New diagnosis"), "diag.txt", { from: doctor1 }),
                "Doctor does not have write access"
            );

            // Grant write access (2)
            await contractInstance.grantAccess(doctor1, 2, 0, { from: patient1 });
            await contractInstance.addRecordForPatient(patient1, web3.utils.sha3("New diagnosis"), "diag.txt", { from: doctor1 });
            const records = await contractInstance.getPatientRecords(patient1, { from: patient1 });
            assert.equal(records.length, 2, "Doctor should have been able to add a record.");
        });

        it("should prevent non-owners from granting access", async () => {
            await expectRevert(
                contractInstance.grantAccess(doctor1, 1, 0, { from: stranger }),
                "revert" // AccessControl error is the default
            );
        });
        
        it("should handle expired access grants", async () => {
            // Grant access for 1 minute
            await contractInstance.grantAccess(doctor1, 1, 60, { from: patient1 });
            let accessLevel = await contractInstance.checkAccess(patient1, doctor1);
            assert.equal(accessLevel, 1, "Doctor should have access initially.");
            
            // Advance time by 61 seconds
            await time.increase(61);
            
            accessLevel = await contractInstance.checkAccess(patient1, doctor1);
            assert.equal(accessLevel, 0, "Access should be expired.");
        });
    });

    // 4. Data Access Security
    describe("Data Access Security", () => {
        beforeEach(async () => {
            await contractInstance.registerAsPatient(patientProfileHash, { from: patient1 });
            await contractInstance.addDoctor(doctor1, doctorProfileHash, { from: admin });
            await contractInstance.uploadRecord(recordHash1, recordFileName1, { from: patient1 });
        });

        it("should allow only authorized users to view records", async () => {
            // Patient can view their own records
            const records = await contractInstance.getPatientRecords(patient1, { from: patient1 });
            assert.equal(records.length, 1, "Patient should be able to see their own records.");

            // Stranger cannot view records
            await expectRevert(
                contractInstance.getPatientRecords(patient1, { from: stranger }),
                "Access denied"
            );

            // Doctor can view after being granted access
            await contractInstance.grantAccess(doctor1, 1, 0, { from: patient1 });
            const doctorView = await contractInstance.getPatientRecords(patient1, { from: doctor1 });
            assert.equal(doctorView.length, 1, "Doctor should be able to see records after grant.");
        });
    });
});
