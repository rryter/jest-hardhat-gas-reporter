// prettier-ignore
export interface ContractABI {
    _format:                string;
    contractName:           string;
    sourceName:             string;
    abi:                    ABI[];
    bytecode:               string;
    deployedBytecode:       string;
}

// prettier-ignore
export interface ABI {
    inputs?:          Put[];
    stateMutability?: StateMutability;
    type:             Type;
    anonymous?:       boolean;
    name?:            string;
    outputs?:         Put[];
}
// prettier-ignore

export interface Put {
    internalType: string;
    name:         string;
    type:         string;
    indexed?:     boolean;
}

// prettier-ignore
export enum StateMutability {
    Nonpayable = "nonpayable",
    Payable = "payable",
    View = "view",
}

// prettier-ignore
export enum Type {
    Constructor = "constructor",
    Event = "event",
    Function = "function",
    Receive = "receive",
}
