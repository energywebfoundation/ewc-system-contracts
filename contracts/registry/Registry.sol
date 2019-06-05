//! Copyright (C) 2019 Energy Web Foundation
//!
//! Licensed under GPL3.
//! You should have received a copy of the GNU General Public License v 3.0 
//! along with this file. If not, see 
//!
//!     https://www.gnu.org/licenses/gpl-3.0.en.html.
//!
//! This file incorporates work covered by the following copyright and  
//! permission notice:
//!
//!     The registry interface.
//!
//!     Copyright 2016 Gavin Wood, Parity Technologies Ltd.
//!
//!     Licensed under the Apache License, Version 2.0 (the "License");
//!     you may not use this file except in compliance with the License.
//!     You may obtain a copy of the License at
//!
//!         http://www.apache.org/licenses/LICENSE-2.0
//!
//!     Unless required by applicable law or agreed to in writing, software
//!     distributed under the License is distributed on an "AS IS" BASIS,
//!     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//!     See the License for the specific language governing permissions and
//!     limitations under the License.

pragma solidity 0.5.8;


interface MetadataRegistry {
    event DataChanged(bytes32 indexed name, string key, string plainKey);

    function getData(bytes32 _name, string calldata _key)
            external
            view
            returns (bytes32);
            
    function getAddress(bytes32 _name, string calldata _key)
            external
            view
            returns (address);

    function getUint(bytes32 _name, string calldata _key)
            external
            view
            returns (uint);
}


interface OwnerRegistry {
    event Reserved(bytes32 indexed name, address indexed owner);
    event Transferred(bytes32 indexed name, address indexed oldOwner, address indexed newOwner);
    event Dropped(bytes32 indexed name, address indexed owner);

    function getOwner(bytes32 _name)
            external
            view
            returns (address);
}


interface ReverseRegistry {
    event ReverseConfirmed(string name, address indexed reverse);
    event ReverseRemoved(string name, address indexed reverse);

    function hasReverse(bytes32 _name)
            external
            view
            returns (bool);

    function getReverse(bytes32 _name)
            external
            view
            returns (address);

    function canReverse(address _data)
            external
            view
            returns (bool);

    function reverse(address _data)
            external
            view
            returns (string memory);
}
