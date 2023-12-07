// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");

// async function main() {
//   const currentTimestampInSeconds = Math.round(Date.now() / 1000);
//   const unlockTime = currentTimestampInSeconds + 60;

//   const lockedAmount = hre.ethers.parseEther("0.001");

//   const lock = await hre.ethers.deployContract("Lock", [unlockTime], {
//     value: lockedAmount,
//   });

//   await lock.waitForDeployment();

//   console.log(
//     `Lock with ${ethers.formatEther(
//       lockedAmount
//     )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
//   );
// }

async function main() {
  const accounts = await ethers.getSigners();
  console.log("Allt accounts are", accounts[0]);
  console.log("Account address:", accounts[0].address);//, "The amount in account is", ethers.utils.formatEther(balance1), "ETH");

  const Amount = hre.ethers.parseEther("0.001");
  const ContractFactory = await ethers.getContractFactory("TicketSystem", {
    value: Amount,
  });
  const contract = await ContractFactory.deploy();
  //await contract.deployed();
  console.log("Contract address: the whole", contract);
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);

  await contract.createEvent(
    "Sample Event",
    currentTimestampInSeconds,
    accounts[0], // Example organizer address
    "https://sample-image-url.com/image.jpg", // Example image URL
    "Mumbai, event hall", // Example location details
    100 // Example maximum supply
  );
  const events = await contract.getAllEvents();
  console.log("The events are", events);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
