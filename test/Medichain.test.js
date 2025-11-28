// const MediChain = artifacts.require("MediChain");
// const chai = require('chai');
// const expect = chai.expect;

// // Sử dụng assert oặc expect của chai
// // artifacts.require trả về một contract abstraction
// // web3.utils.sha3 tạo hash cho string
// (async () => {
//     const chaiAsPromised = await import('chai-as-promised');
//     chai.use(chaiAsPromised.default); // Lưu ý .default vì nó là ES module
// })();
// contract("MediChain", function (accounts) {
//     let mediChain;
//     const owner = accounts[0]; // Bệnh nhân
//     const doctor1 = accounts[1]; // Bác sĩ
//     const doctor2 = accounts[2]; // Bác sĩ khác
//     const other = accounts[3]; // Tài khoản khác

//     // Tạo bytes32 từ string, Truffle không có formatBytes32String như ethers
//     const testDataHash = web3.utils.sha3("test_ehr_hash");
//     const testOffChainAddress = "ipfs://test_address";
//     const testEncryptedKey = web3.utils.asciiToHex("encrypted_symmetric_key_for_doctor1"); // Chuyển string sang bytes

//     beforeEach(async () => {
//         mediChain = await MediChain.new({ from: owner });
//         await mediChain.registerEHR(testDataHash, testOffChainAddress, { from: owner });
//     });

//     describe("EHR Registration", () => {
//         it("Should allow a patient to register EHR", async () => {
//             const newPatient = other;
//             const newHash = web3.utils.sha3("new_ehr_hash_for_other");
//             const newAddress = "ipfs://new_address_for_other";
            
//             // Đăng ký cho tài khoản khác để test đăng ký mới
//             const tx = await mediChain.registerEHR(newHash, newAddress, { from: newPatient });

//             // Kiểm tra Event
//             expect(tx.logs[0].event).to.equal("EHRRegistered");
//             expect(tx.logs[0].args.patient).to.equal(newPatient); // Check tài khoản mới
//             expect(tx.logs[0].args.dataHash).to.equal(newHash);
//             expect(tx.logs[0].args.offChainAddress).to.equal(newAddress);

//             const ehr = await mediChain.patientEHRs(newPatient);
//             expect(ehr.dataHash).to.equal(newHash);
//             expect(ehr.offChainAddress).to.equal(newAddress);
//             expect(ehr.owner).to.equal(newPatient);
//         });

//         it("Should prevent registering EHR multiple times by the same patient", async () => {
//             // Test này dựa vào việc owner đã đăng ký trong beforeEach
//             await expect(
//                 mediChain.registerEHR(web3.utils.sha3("another_hash"), "new_address", { from: owner })
//             ).to.be.rejectedWith("EHR already registered for this patient.");
//         });
//     });

//     describe("Access Control", () => {

//         it("Should allow patient to grant access", async () => {
//             const tx = await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });

//             expect(tx.logs[0].event).to.equal("AccessGranted");
//             expect(tx.logs[0].args.patient).to.equal(owner);
//             expect(tx.logs[0].args.receiver).to.equal(doctor1);

//             const grant = await mediChain.patientAccessGrants(owner, doctor1);
//             expect(grant.encryptedSymmetricKey).to.equal(testEncryptedKey);
//             expect(grant.revoked).to.be.false;
//         });

//         it("Should prevent granting access to self", async () => {
//             await expect(
//                 mediChain.grantAccess(owner, testEncryptedKey, { from: owner })
//             ).to.be.rejectedWith("Cannot grant access to self.");
//         });

//         it("Should allow an authorized doctor to get EHR info", async () => {
//             await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
//             const info = await mediChain.getEHRInfo(owner, { from: doctor1 });
//             const hash = info[0];
//             const address = info[1];
//             expect(hash).to.equal(testDataHash);
//             expect(address).to.equal(testOffChainAddress);
//         });

//         it("Should allow an authorized doctor to get encrypted symmetric key", async () => {
//             await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
//             const receivedKey = await mediChain.getEncryptedSymmetricKey(owner, { from: doctor1 });
//             expect(receivedKey).to.equal(testEncryptedKey);
//         });

//         it("Should prevent unauthorized user from getting EHR info", async () => {
//             await expect(
//                 mediChain.getEHRInfo(owner, { from: other })
//             ).to.be.rejectedWith("Access denied.");
//         });

//         it("Should prevent unauthorized user from getting encrypted symmetric key", async () => {
//             await expect(
//                 mediChain.getEncryptedSymmetricKey(owner, { from: other })
//             ).to.be.rejectedWith("Access denied or revoked.");
//         });

//         it("Should allow patient to revoke access", async () => {
//             await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
//             const tx = await mediChain.revokeAccess(doctor1, { from: owner });

//             expect(tx.logs[0].event).to.equal("AccessRevoked");
//             expect(tx.logs[0].args.patient).to.equal(owner);
//             expect(tx.logs[0].args.receiver).to.equal(doctor1);

//             const grant = await mediChain.patientAccessGrants(owner, doctor1);
//             expect(grant.revoked).to.be.true;
//         });

//         it("Should prevent revoked doctor from getting EHR info", async () => {
//             await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
//             await mediChain.revokeAccess(doctor1, { from: owner });
//             await expect(
//                 mediChain.getEHRInfo(owner, { from: doctor1 })
//             ).to.be.rejectedWith("Access denied.");
//         });

//         it("Should prevent revoked doctor from getting encrypted symmetric key", async () => {
//             await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
//             await mediChain.revokeAccess(doctor1, { from: owner });
//             await expect(
//                 mediChain.getEncryptedSymmetricKey(owner, { from: doctor1 })
//             ).to.be.rejectedWith("Access denied or revoked.");
//         });
//     });
// });

// blockchain/test/MediChain.test.js
const MediChain = artifacts.require("MediChain");
const chai = require('chai');
const expect = chai.expect;

// Import và cấu hình chai-as-promised để xử lý các promises bị reject (revert)
(async () => {
    const chaiAsPromised = await import('chai-as-promised');
    chai.use(chaiAsPromised.default);
})();

contract("MediChain", function (accounts) {
    let mediChain;
    const owner = accounts[0]; // Bệnh nhân chính
    const doctor1 = accounts[1]; // Bác sĩ 1
    const doctor2 = accounts[2]; // Bác sĩ 2
    const other = accounts[3]; // Bệnh nhân khác / Tài khoản không được ủy quyền

    // Tạo dữ liệu test
    const testDataHash = web3.utils.sha3("test_ehr_hash_for_owner");
    const testOffChainAddress = "ipfs://test_address_for_owner";
    const testEncryptedKey = web3.utils.asciiToHex("encrypted_symmetric_key_for_doctor1");

    beforeEach(async () => {
        // Triển khai contract mới trước mỗi test
        mediChain = await MediChain.new({ from: owner });
        // Đăng ký EHR cho owner để chuẩn bị cho các test case về Access Control
        await mediChain.registerEHR(testDataHash, testOffChainAddress, { from: owner });
    });

    describe("EHR Registration", () => {
        it("Should allow a NEW patient to register EHR", async () => {
            const newPatient = other;
            const newHash = web3.utils.sha3("new_ehr_hash_for_other");
            const newAddress = "ipfs://new_address_for_other";
            
            // Đăng ký cho tài khoản khác chưa từng đăng ký
            const tx = await mediChain.registerEHR(newHash, newAddress, { from: newPatient });

            // Kiểm tra Event
            expect(tx.logs[0].event).to.equal("EHRRegistered");
            expect(tx.logs[0].args.patient).to.equal(newPatient);
            expect(tx.logs[0].args.dataHash).to.equal(newHash);
            expect(tx.logs[0].args.offChainAddress).to.equal(newAddress);

            // Kiểm tra state trên blockchain
            const ehr = await mediChain.patientEHRs(newPatient);
            expect(ehr.dataHash).to.equal(newHash);
            expect(ehr.offChainAddress).to.equal(newAddress);
            expect(ehr.owner).to.equal(newPatient);
        });

        it("Should prevent registering EHR multiple times by the same patient", async () => {
            // Test này sử dụng owner, người đã đăng ký trong beforeEach
            await expect(
                mediChain.registerEHR(web3.utils.sha3("another_hash"), "new_address", { from: owner })
            ).to.be.rejectedWith("EHR already registered for this patient.");
        });
    });

    describe("Access Control", () => {

        it("Should allow patient to grant access", async () => {
            const tx = await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });

            expect(tx.logs[0].event).to.equal("AccessGranted");
            expect(tx.logs[0].args.patient).to.equal(owner);
            expect(tx.logs[0].args.receiver).to.equal(doctor1);

            const grant = await mediChain.patientAccessGrants(owner, doctor1);
            expect(grant.encryptedSymmetricKey).to.equal(testEncryptedKey);
            expect(grant.revoked).to.be.false;
            // grantTimestamp sẽ là BN (BigNumber), có thể kiểm tra > 0
            expect(grant.grantTimestamp.toNumber()).to.be.above(0);
        });

        it("Should prevent granting access to self", async () => {
            await expect(
                mediChain.grantAccess(owner, testEncryptedKey, { from: owner })
            ).to.be.rejectedWith("Cannot grant access to self.");
        });

        it("Should prevent granting access to address(0)", async () => {
             await expect(
                mediChain.grantAccess("0x0000000000000000000000000000000000000000", testEncryptedKey, { from: owner })
            ).to.be.rejectedWith("Receiver address cannot be zero.");
        });

        it("Should allow an authorized doctor to get EHR info", async () => {
            await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
            
            // getEHRInfo trả về object {0: hash, 1: address, 2: timestamp}
            const info = await mediChain.getEHRInfo(owner, { from: doctor1 });
            const hash = info[0];
            const address = info[1];
            
            expect(hash).to.equal(testDataHash);
            expect(address).to.equal(testOffChainAddress);
        });

        it("Should allow an authorized doctor to get encrypted symmetric key", async () => {
            await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
            const receivedKey = await mediChain.getEncryptedSymmetricKey(owner, { from: doctor1 });
            expect(receivedKey).to.equal(testEncryptedKey);
        });

        it("Should prevent unauthorized user from getting EHR info", async () => {
            await expect(
                mediChain.getEHRInfo(owner, { from: other })
            ).to.be.rejectedWith("Access denied.");
        });

        it("Should prevent unauthorized user from getting encrypted symmetric key", async () => {
            await expect(
                mediChain.getEncryptedSymmetricKey(owner, { from: other })
            ).to.be.rejectedWith("Access denied or revoked.");
        });

        it("Should allow patient to revoke access", async () => {
            await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
            const tx = await mediChain.revokeAccess(doctor1, { from: owner });

            expect(tx.logs[0].event).to.equal("AccessRevoked");
            expect(tx.logs[0].args.patient).to.equal(owner);
            expect(tx.logs[0].args.receiver).to.equal(doctor1);

            const grant = await mediChain.patientAccessGrants(owner, doctor1);
            expect(grant.revoked).to.be.true;
        });

        it("Should prevent revoked doctor from getting EHR info", async () => {
            await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
            await mediChain.revokeAccess(doctor1, { from: owner });
            await expect(
                mediChain.getEHRInfo(owner, { from: doctor1 })
            ).to.be.rejectedWith("Access denied.");
        });

        it("Should prevent revoked doctor from getting encrypted symmetric key", async () => {
            await mediChain.grantAccess(doctor1, testEncryptedKey, { from: owner });
            await mediChain.revokeAccess(doctor1, { from: owner });
            await expect(
                mediChain.getEncryptedSymmetricKey(owner, { from: doctor1 })
            ).to.be.rejectedWith("Access denied or revoked.");
        });

        it("Should prevent revoking access that was never granted", async () => {
            await expect(
                mediChain.revokeAccess(doctor2, { from: owner })
            ).to.be.rejectedWith("No active access to revoke.");
        });
    });
});