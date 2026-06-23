// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {IERC165} from "@openzeppelin/contracts/interfaces/IERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title NFT Marketplace with ERC20/ERC721 Support
/// @author GitHub.com/LikeSouvenir
/// @notice A decentralized marketplace for buying, selling, and making offers on NFTs.
/// Supports listing NFTs for sale, accepting offers, and collecting platform fees.
/// Uses ReentrancyGuard for security and supports both ERC20 and ERC721 standards.
/// Platform fee is configurable and sent to a specified recipient.
contract Marketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Math for uint256;

    uint256 private constant FEE_DENOMINATOR_BPS = 10_000;
    uint256 private feeBps = 200;
    address private feeReceiver;

    struct TokenPrice {
        IERC20 payableToken; //bytes20
        bool isListed; //bytes1
        bool isOffered; //bytes1
        uint256 price;
    }

    struct Offer {
        uint256 endTime;
        uint256 amount;
    }
    mapping(address NFT => mapping(uint256 tokenId => TokenPrice)) private _nftInfoMap;
    mapping(address NFT => mapping(uint256 tokenId => mapping(address from => Offer))) private _offers;

    error ZeroAddress();
    error ZeroPrice();
    error ZeroOffer();
    error NotListed();
    error IsListed();
    error NotOffered();
    error IsOffered();
    error IncorrectTime();
    error UnsupportedERC721();
    error NotApprovalOrOperatorOrOwner();
    error NotApprovalOrOperator();
    error NotApproval();
    error PermissionDenied();
    error IncorrectMin();
    error IncorrectMax();

    event IncorrectRoyalty(address addressNFT, uint256 tokenId);
    event ItemListed(address indexed addressNFT, uint256 indexed tokenId);
    event ItemDelisted(address indexed addressNFT, uint256 indexed tokenId);
    event ItemUpdated(address indexed addressNFT, uint256 indexed tokenId, address addressERC20, uint256 cost);
    event ItemSold(address indexed addressNFT, uint256 indexed tokenId, uint256 cost, uint256 royalty);
    event OfferCreated(
        address indexed addressNFT, uint256 indexed tokenId, address indexed from, uint256 endTime, uint256 amount
    );
    event OfferCanceled(address indexed addressNFT, uint256 indexed tokenId, address indexed from);
    event UpdatePlatformFee(uint256 indexed fee);
    event UpdatePlatformFeeRecipient(address indexed recipient);

    /// @notice Initializes the marketplace with fee receiver
    /// @param feeReceiver_ Address that will receive platform fees
    constructor(address feeReceiver_) Ownable(msg.sender) {
        require(feeReceiver_ != address(0), ZeroAddress());
        feeReceiver = feeReceiver_;
    }

    modifier supportIERC721(address addressNFT) {
        _supportIERC721(addressNFT);
        _;
    }

    /// @dev Checks if contract supports IERC721 interface
    function _supportIERC721(address addressNFT) internal view {
        try IERC165(addressNFT).supportsInterface(type(IERC721).interfaceId) returns (bool success) {
            require(success, UnsupportedERC721());
        } catch {
            revert UnsupportedERC721();
        }
    }

    modifier notListed(address addressNFT, uint256 tokenId) {
        _notListed(addressNFT, tokenId);
        _;
    }

    function _notListed(address addressNFT, uint256 tokenId) internal view {
        require(!_nftInfoMap[addressNFT][tokenId].isListed, IsListed());
    }

    modifier isListed(address addressNFT, uint256 tokenId) {
        _isListed(addressNFT, tokenId);
        _;
    }

    function _isListed(address addressNFT, uint256 tokenId) internal view {
        require(_nftInfoMap[addressNFT][tokenId].isListed, NotListed());
    }

    modifier notOffered(address addressNFT, uint256 tokenId) {
        _notOffered(addressNFT, tokenId);
        _;
    }

    function _notOffered(address addressNFT, uint256 tokenId) internal view {
        require(!_nftInfoMap[addressNFT][tokenId].isOffered, IsOffered());
    }

    modifier isOffered(address addressNFT, uint256 tokenId) {
        _isOffered(addressNFT, tokenId);
        _;
    }

    function _isOffered(address addressNFT, uint256 tokenId) internal view {
        require(_nftInfoMap[addressNFT][tokenId].isOffered, NotOffered());
    }

    modifier notZeroPrice(uint256 price) {
        _notZeroPrice(price);
        _;
    }

    function _notZeroPrice(uint256 price) internal pure {
        require(price > 0, ZeroPrice());
    }

    modifier notZeroAddress(address account) {
        _notZeroAddress(account);
        _;
    }

    function _notZeroAddress(address account) internal pure {
        require(account != address(0), ZeroAddress());
    }

    modifier haveRules(address addressNFT, uint256 tokenId) {
        _haveRules(addressNFT, tokenId);
        _;
    }

    function _haveRules(address addressNFT, uint256 tokenId) internal view {
        IERC721 nft = IERC721(addressNFT);
        address tokenOwner = nft.ownerOf(tokenId);
        require(
            tokenOwner == msg.sender || nft.isApprovedForAll(tokenOwner, msg.sender)
                || nft.getApproved(tokenId) == msg.sender,
            NotApprovalOrOperatorOrOwner()
        );
    }

    /// @notice Adds a new NFT to the marketplace for sale
    /// @dev Requires approval for the marketplace to transfer the NFT. Emit ItemListed event
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT to list
    /// @param addressToken Address of the ERC20 token to accept as payment
    /// @param price Price of the NFT in the specified ERC20 token
    function add(address addressNFT, uint256 tokenId, address addressToken, uint256 price)
        external
        notZeroAddress(addressToken)
        notZeroAddress(addressNFT)
        supportIERC721(addressNFT)
        notListed(addressNFT, tokenId)
        notZeroPrice(price)
    {
        IERC721 nft = IERC721(addressNFT);
        address tokenOwner = nft.ownerOf(tokenId);
        require(
            IERC721(addressNFT).isApprovedForAll(tokenOwner, address(this))
                || IERC721(addressNFT).getApproved(tokenId) == address(this),
            NotApprovalOrOperator()
        );

        //        TokenPrice storage tokenInfo = _nftInfoMap[addressNFT][tokenId];

        //        tokenInfo.payableToken = IERC20(addressToken);
        //        tokenInfo.price = price;
        //        tokenInfo.isListed = true;
        //        tokenInfo.isOffered = true;

        _nftInfoMap[addressNFT][tokenId] =
            TokenPrice({payableToken: IERC20(addressToken), price: price, isListed: true, isOffered: true});

        emit ItemListed(addressNFT, tokenId);
    }

    /// @notice Updates the price and payment token for a listed NFT
    /// @dev Only callable by the NFT owner or approved operator. Emit ItemUpdated event
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT to update
    /// @param addressToken Address of the new ERC20 token to accept as payment
    /// @param price New price of the NFT
    function change(address addressNFT, uint256 tokenId, address addressToken, uint256 price)
        external
        isListed(addressNFT, tokenId)
        haveRules(addressNFT, tokenId)
        notZeroAddress(addressToken)
        notZeroPrice(price)
    {
        TokenPrice storage tokenInfo = _nftInfoMap[addressNFT][tokenId];
        tokenInfo.payableToken = IERC20(addressToken);
        tokenInfo.price = price;

        emit ItemUpdated(addressNFT, tokenId, addressToken, price);
    }

    /// @notice Cancels the listing of an NFT
    /// @dev Only callable by the NFT owner or approved operator. Emit ItemDelisted event
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT to cancel
    function cancel(address addressNFT, uint256 tokenId)
        external
        isListed(addressNFT, tokenId)
        haveRules(addressNFT, tokenId)
    {
        delete _nftInfoMap[addressNFT][tokenId];

        emit ItemDelisted(addressNFT, tokenId);
    }

    /// @notice Buys a listed NFT at its current price
    /// @dev Transfers the NFT to the buyer and pays the seller, minus platform fee. Emit ItemSold event
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT to buy
    function buy(address addressNFT, uint256 tokenId) external {
        _send(addressNFT, tokenId, 0, msg.sender);
    }

    /// @notice Disables offers for a listed NFT
    /// @dev Only callable by the NFT owner or approved operator
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT
    function offOffers(address addressNFT, uint256 tokenId)
        external
        haveRules(addressNFT, tokenId)
        isOffered(addressNFT, tokenId)
        isListed(addressNFT, tokenId)
    {
        _nftInfoMap[addressNFT][tokenId].isOffered = false;
    }

    /// @notice Enables offers for a listed NFT
    /// @dev Only callable by the NFT owner or approved operator
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT
    function onOffers(address addressNFT, uint256 tokenId)
        external
        haveRules(addressNFT, tokenId)
        notOffered(addressNFT, tokenId)
        isListed(addressNFT, tokenId)
    {
        _nftInfoMap[addressNFT][tokenId].isOffered = true;
    }

    /// @notice Places an offer on a listed NFT
    /// @dev Offer is valid until endTime. Emit OfferCreated event. Requires NFT to be listed and offers enabled.
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT
    /// @param offer Amount of the offer in the NFT's payment token
    /// @param endTime Timestamp when the offer expires
    function setOffer(address addressNFT, uint256 tokenId, uint256 offer, uint256 endTime)
        external
        isListed(addressNFT, tokenId)
        isOffered(addressNFT, tokenId)
    {
        require(block.timestamp < endTime, IncorrectTime());
        require(offer > 0, ZeroOffer());
        uint256 allowance = _nftInfoMap[addressNFT][tokenId].payableToken.allowance(msg.sender, address(this));
        require(allowance >= offer, NotApproval());

        _offers[addressNFT][tokenId][msg.sender] = Offer({endTime: endTime, amount: offer});

        emit OfferCreated(addressNFT, tokenId, msg.sender, endTime, offer);
    }

    /// @notice Cancels an existing offer on an NFT
    /// @dev Can be called by the offerer or after the offer expires. Emit OfferCanceled event
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT
    /// @param from Address of the offer creator
    function closeOffer(address addressNFT, uint256 tokenId, address from) external {
        uint256 endTime = _offers[addressNFT][tokenId][from].endTime;

        if (endTime < block.timestamp || from == msg.sender) {
            delete _offers[addressNFT][tokenId][from];
        } else {
            revert PermissionDenied();
        }

        emit OfferCanceled(addressNFT, tokenId, from);
    }

    /// @notice Accepts an offer on a listed NFT
    /// @dev Transfers the NFT to the offerer and pays the seller, minus platform fee. Emit ItemSold and OfferCanceled event
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT
    /// @param from Address of the offer creator
    function receiveOffer(address addressNFT, uint256 tokenId, address from) external haveRules(addressNFT, tokenId) {
        Offer memory offer = _offers[addressNFT][tokenId][from];

        require(offer.endTime >= block.timestamp, IncorrectTime());

        delete _offers[addressNFT][tokenId][from];

        _send(addressNFT, tokenId, offer.amount, from);

        emit OfferCanceled(addressNFT, tokenId, from);
    }

    /// @dev Internal function to process NFT sale
    /// @param addressNFT NFT contract address
    /// @param tokenId NFT token ID
    /// @param price Sale price (0 to use listed price)
    /// @param nftRecipient Address receiving the NFT
    function _send(address addressNFT, uint256 tokenId, uint256 price, address nftRecipient)
        internal
        isListed(addressNFT, tokenId)
        nonReentrant
    {
        TokenPrice storage tokenInfo = _nftInfoMap[addressNFT][tokenId];
        if (price == 0) {
            price = tokenInfo.price;
        }
        uint256 grossPrice = price;

        require(tokenInfo.payableToken.allowance(nftRecipient, address(this)) >= price, NotApproval());
        address tokenOwner = IERC721(addressNFT).ownerOf(tokenId);

        tokenInfo.isListed = false;
        tokenInfo.isOffered = false;

        uint256 royalty;
        if (IERC165(addressNFT).supportsInterface(type(IERC2981).interfaceId)) {
            try IERC2981(addressNFT).royaltyInfo(tokenId, price) returns (address receiver, uint256 royaltyAmount) {
                if (royaltyAmount <= price && receiver != address(0)) {
                    price -= royaltyAmount;
                    tokenInfo.payableToken.safeTransferFrom(nftRecipient, receiver, royaltyAmount);
                    royalty = royaltyAmount;
                }
            } catch {
                emit IncorrectRoyalty(addressNFT, tokenId);
            }
        }

        uint256 fee = calculatePercent(price);

        tokenInfo.payableToken.safeTransferFrom(nftRecipient, feeReceiver, fee);
        tokenInfo.payableToken.safeTransferFrom(nftRecipient, tokenOwner, price - fee);

        IERC721(addressNFT).safeTransferFrom(tokenOwner, nftRecipient, tokenId);

        emit ItemSold(addressNFT, tokenId, grossPrice, royalty);
    }

    /// @notice Returns the offer details for a specific NFT and offerer
    /// @dev Returns zero values if no offer exists
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT
    /// @param from Address of the offerer
    /// @return Offer details (endTime, amount)
    function getOffers(address addressNFT, uint256 tokenId, address from) external view returns (Offer memory) {
        return _offers[addressNFT][tokenId][from];
    }

    /// @notice Sets the platform fee percentage (in basis points)
    /// @dev Only callable by the contract owner. Emit UpdatePlatformFee event
    /// @param feeBPS New fee percentage in basis points (e.g., 200 = 2%)
    function setFeePercent(uint256 feeBPS) external onlyOwner {
        require(feeBPS >= 1, IncorrectMin());
        require(feeBPS <= 10_000, IncorrectMax());
        feeBps = feeBPS;

        emit UpdatePlatformFee(feeBPS);
    }

    /// @notice Calculates the platform fee for a given price.
    /// @dev Uses the current fee percentage
    /// @param price Price to calculate fee for
    /// @return fee amount
    function calculatePercent(uint256 price) public view returns (uint256 fee) {
        fee = price.mulDiv(feeBps, FEE_DENOMINATOR_BPS);
    }

    /// @notice Returns the current platform fee percentage
    /// @dev In basis points (e.g., 200 = 2%)
    /// @return Current fee in basis points
    function getFeeBPS() external view returns (uint256) {
        return feeBps;
    }

    /// @notice Sets the address to receive platform fees
    /// @dev Only callable by the contract owner. Emit UpdatePlatformFeeRecipient event
    /// @param newFeeReceiver Address to receive fees
    function setFeeReceiver(address newFeeReceiver) external notZeroAddress(newFeeReceiver) onlyOwner {
        feeReceiver = newFeeReceiver;

        emit UpdatePlatformFeeRecipient(feeReceiver);
    }

    /// @notice Returns the current fee recipient address
    /// @dev Address where platform fees are sent
    /// @return Current fee recipient
    function getReceiver() external view returns (address) {
        return feeReceiver;
    }

    /// @notice Returns the payment token and price for a listed NFT
    /// @dev Reverts if the NFT is not listed
    /// @param addressNFT Address of the NFT contract
    /// @param tokenId ID of the NFT
    /// @return payableToken Payment token contract
    /// @return price Payment token contract, price
    function getByAddressAndId(address addressNFT, uint256 tokenId)
        external
        view
        isListed(addressNFT, tokenId)
        returns (IERC20 payableToken, uint256 price)
    {
        TokenPrice storage tokenInfo = _nftInfoMap[addressNFT][tokenId];
        return (tokenInfo.payableToken, tokenInfo.price);
    }
}
