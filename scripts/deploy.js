// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require("hardhat");
//const QRCode = require('qrcode');
const qr = require('qr-image');
const fs = require('fs');
const axios = require('axios');

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

// Upload file to IPFS
// async function uploadFileToIPFS(file) {
//   try {
//     const response = await ipfs.add(file);
//     console.log('IPFS Hash:', response.cid.toString());
//     return response.cid.toString();
//   } catch (error) {
//     console.error('Error uploading file to IPFS:', error);
//   }
// }

const PINATA_API_ENDPOINT = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const PINATA_API_KEY = '3dbc496fb6aa96900081';
const PINATA_SECRET_API_KEY = '560f60d24b64a2c050ada3d41a264db0d54518fee054b7c7a8db07ad2c1b43a0';

// Upload file to Pinata
async function uploadFileToPinata() {
  try {
    const fileBuffer = fs.readFileSync('sample1.jpeg');

    const fileBlob = new Blob([fileBuffer], { type: 'image/jpeg' });

    // Create FormData and append file
    const data = new FormData();
    data.append('file', fileBlob, 'sample1.jpeg');

    const metadata = {
      name: 'EventBanner', // Name for the metadata
      keyvalues: {
        exampleKey: 'exampleValue', //key value pairs 
      },
    };
    data.append('pinataMetadata', JSON.stringify(metadata));
    const response = await axios.post(PINATA_API_ENDPOINT, data, {
      headers: {
        'Content-Type': 'json/application',
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });
    console.log('IPFS file upload response :', response);
    return "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to Pinata:', error);
  }
}

const uploadJSONToIPFS = async (JSONBody) => {
  //api endpoint for uploading json to IPFS
  const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

  const pinataData = {
    pinataContent: JSONBody,
  };

  //making axios POST request to Pinata ⬇️
  return axios
    .post(url, pinataData, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    })
    .then(function (response) {
      return {
        success: true,
        pinataURL:
          "https://gateway.pinata.cloud/ipfs/" + response.data.IpfsHash,
      };
    })
    .catch(function (error) {
      return {
        success: false,
        message: error.message,
      };
    });
};

async function main() {
  const accounts = await ethers.getSigners();
  console.log("Account address:", accounts[0].address);//, "The amount in account is", ethers.utils.formatEther(balance1), "ETH");

  const Amount = hre.ethers.parseEther("0.001");
  const ContractFactory = await ethers.getContractFactory("TicketSystem", {
    value: Amount,
  });
  const contract = await ContractFactory.deploy();
  //await contract.deployed();
  console.log("Contract address: the whole", contract);
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);


  const ipfshash = await uploadFileToPinata();
  console.log("The ipfs hash is", ipfshash);
  await contract.createEvent(
    "Sample Event",
    currentTimestampInSeconds,
    accounts[0], // Example organizer address
    ipfshash, // Example image URL
    "Mumbai, event hall", // Example location details
    100 // Example maximum supply
  );
  const events = await contract.getAllEvents();
  console.log("The events are", events);

  // Sample JSON object
  const jsonObject = {
    name: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '7559360215',
    seatNumber: 'A1',
    type: 'VIP',
  };

  // Convert JSON object to string
  const jsonString = JSON.stringify(jsonObject);
  const buffer = Buffer.from(jsonString);

  const qrImage = qr.imageSync(jsonString, { type: 'png' });

  // Write the buffer to a file
  fs.writeFileSync('./qrcode.png', qrImage, (err) => {
    if (err) {
      console.error('Error generating QR code:', err);
    } else {
      console.log('QR code generated successfully!');
    }
  });


  const _eventId = 0;
  const _QRCode = await uploadJSONToIPFS(jsonObject);
  console.log("//////////////QR Code", _QRCode.pinataURL);
  const _price = hre.ethers.parseEther("0.185");
  const buyTicketTx = await contract.buyTicket(_eventId, _QRCode, _price);
  await buyTicketTx.wait();

  // Call other functions if needed and log the results
  const ticket = await contract.getTicketById(0);
  console.log("Ticket Details:", ticket);

  const ticketsByEvent = await contract.getTicketIdsByEvent(_eventId);
  console.log("Tickets by Event ID:", ticketsByEvent);

  const ticketsByOwner = await contract.getTicketIdsByOwner(accounts[0].address);
  console.log("Tickets by Owner:", ticketsByOwner);

  const isTicketOwner = await contract.verifyTicketOwner(accounts[0].address, 0);
  console.log("Is Ticket Owner:", isTicketOwner);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

