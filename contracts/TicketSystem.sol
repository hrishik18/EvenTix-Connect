// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

// import "./MyERC1155Receiver.sol";

contract TicketSystem is ERC1155, Ownable {
    // Structure for Event
    struct Event {
        uint256 eventId;
        string eventName;
        uint256 startTime;
        address organizer;
        string baseImage; // IPFS URL
        string locationDetails;
        uint256 maximumSupply;
        uint256 currentSupply;
    }

    // Structure for Ticket
    struct Ticket {
        uint256 eventId;
        uint256 ticketId;
        address payable owner;
        string QRCode;
        uint256 price;
        bool isActive;
    }
    // Token ID counter for event IDs
    struct Counter {
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    Counter private eventIdCounter;
    Counter private TicketCounter;
    Event[] public events;
    mapping(uint256 => Ticket) public ticketsById; // Mapping ticketId to Ticket
    mapping(uint256 => Ticket[]) public ticketsByEvent; // Mapping eventId to ticketId
    mapping(address => Ticket[]) public ticketsByOwner; // Mapping owner's address to ticketIds

    constructor() ERC1155("") {
        // _setURI("https://ipfs.io/");
    }

    // function _update(
    //     address to,
    //     uint256 ticketId,
    //     address auth
    // ) internal override(ERC721, ) returns (address) {
    //     return super._update(to, ticketId, auth);
    // }
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    function createEvent(
        string memory _eventName,
        uint256 _startTime,
        address _organizer,
        string memory _baseImage,
        string memory _locationDetails,
        uint256 _maximumSupply
    ) public {
        // Create a new Event object
        Event memory newEvent = Event(
            eventIdCounter._value,
            _eventName,
            _startTime,
            payable(_organizer),
            _baseImage,
            _locationDetails,
            _maximumSupply,
            0 // Initial currentSupply set to 0
        );

        // Add the new Event to the array of events
        events.push(newEvent);
        eventIdCounter._value++;
        // check of pre minting and safeTransfer from msg.sender to contract ??
        //_mint(msg.sender, currentTokenId, amount, "");
    }

    function buyTicket(
        uint256 _eventId,
        string memory _QRCode,
        uint256 _price
    ) public {
        // Validate if the event exists
        require(_eventId < events.length, "Event does not exist");

        // Get the event from the array
        Event storage eventItem = events[_eventId];

        // Validate if tickets are available
        require(
            eventItem.currentSupply < eventItem.maximumSupply,
            "No more tickets available"
        );
        uint currentTokenId = TicketCounter._value;
        // Create a new ticket
        Ticket memory newTicket = Ticket(
            _eventId,
            eventItem.currentSupply,
            payable(msg.sender),
            _QRCode,
            _price,
            true
        );
        ticketsById[currentTokenId] = newTicket;
        ticketsByEvent[_eventId].push(newTicket);
        ticketsByOwner[msg.sender].push(newTicket);
        _mint(
            msg.sender,
            _eventId,
            1,
            abi.encodePacked("Metadata for the token")
        ); // or safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)
        // Increment the current of the event
        eventItem.currentSupply++;
    }

    function getAllEvents() public view returns (Event[] memory) {
        return events;
    }

    // Function to retrieve ticket details by ticketId
    function getTicketById(
        uint256 _ticketId
    ) public view returns (Ticket memory) {
        return ticketsById[_ticketId];
    }

    // Function to get an array of ticketIds by eventId
    function getTicketIdsByEvent(
        uint256 _eventId
    ) public view returns (Ticket[] memory) {
        return ticketsByEvent[_eventId];
    }

    // Function to get an array of ticketIds owned by an address
    function getTicketIdsByOwner(
        address _owner
    ) public view returns (Ticket[] memory) {
        return ticketsByOwner[_owner];
    }

    function verifyTicketOwner(
        address _owner,
        uint256 _ticketId
    ) public view returns (bool) {
        return ticketsById[_ticketId].owner == payable(_owner);
    }

    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
