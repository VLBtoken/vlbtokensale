pragma solidity ^0.4.0;
import './lib/lifecycle/Pausable.sol';

contract VLBProxy is Pausable {
    address public icoContractAddress;

    function VLBProxy(address adr) public {
        require(adr != address(0));
        icoContractAddress = adr;
    }

    function update(address newAdr) whenPaused onlyOwner public {
        require(newAdr != address(0));
        icoContractAddress = newAdr;
    }

    function() public {
        if (!icoContractAddress.delegatecall(msg.data)) revert();
    }

    function destroy() onlyOwner whenPaused public {
        selfdestruct(owner);
    }

    function destroyAndSend(address _recipient) onlyOwner whenPaused public {
        selfdestruct(_recipient);
    }
}
