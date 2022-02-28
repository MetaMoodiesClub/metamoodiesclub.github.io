const contractAddress = "0x15E94A0ad5F135fe08905D752f1D400E2F10eDBC";
const networkId = 4; // Rinkeby testnet
let mintCount = 1;
let web3;
let contract;
let whitelist;

let preSaleLive = false;
let publicSaleLive = false;
let costPerNFT = 2000000;
let maxMintCount = 3;
let remainingSupply = 1010;

const getWeb3 = () => {
    return new Promise((resolve, reject) => {
        window.addEventListener("load", async () => {
            if (window.ethereum) {
                web3 = new Web3(window.ethereum);
                try {
                    resolve(web3);
                } catch (error) {
                    reject(error);
                }
            } else {
                reject("Must install MetaMask");
                setError("Please install Metamask!");
            }
        });
    });
};

const getContract = async () => {
    return new Promise(async (resolve, reject) => {
        try {
            const data = await $.getJSON("./contract/MetaMoodiesClub.json");
            whitelist = await $.getJSON("./contract/whitelist.json");
            contract = new web3.eth.Contract(
                data.abi,
                contractAddress
            );
            resolve(contract);
        } catch (error) {
            reject(error);
        }
    });
};

const getAccounts = async () => {
    return window.ethereum.request({ method: "eth_requestAccounts" });
}

const updateMintCountText = async () => {
    $("#mint-count").text(mintCount);
}

const setError = async (message) => {
    $("#mint-success").hide();
    $("#mint-error").text(message).show();
}

const disableState = async () => {
    $("#mint-count-minus").prop( "disabled", true );
    $("#mint-count-plus").prop( "disabled", true );
    $("#mint-button").text("Minting...").prop( "disabled", true );
    $("#mint-error").hide();
    $("#mint-success").hide();
}

const enableState = async () => {
    $("#mint-count-minus").prop( "disabled", false );
    $("#mint-count-plus").prop( "disabled", false );
    $("#mint-button").text("Mint Moodies").prop( "disabled", false );   
}

// Add listeners for button
const addListeners = async () => {
    mintCount = 1;
    $("#connect-metamask-button").on("click", async (e) => {
        e.preventDefault();
        $("#connect-metamask-button").text("Connecting...");
        getAccounts().then(() => {
            $("#mint-counters").show();
            $("#mint-button").show();
            $("#connect-metamask-button").hide();
            $("#mint-error").hide();
        }).catch((error) => {
            $("#mint-counters").hide();
            $("#mint-button").hide();
            $("#connect-metamask-button").show();
            setError("Error connecting to Metamask. Please try again!");
        }).finally(() => {
            $("#connect-metamask-button").text("Connect Wallet");
        });
    });
    $("#mint-count-minus").on("click", async (e) => {
        e.preventDefault();
        if (mintCount > 1) mintCount--;
        updateMintCountText();
    });
    $("#mint-count-plus").on("click", async (e) => {
        e.preventDefault();
        if (mintCount < maxMintCount) mintCount++;
        updateMintCountText();
    });
    $("#mint-button").on("click", async (e) => {
        e.preventDefault();
        mintMoodies();
    });
}

const fetchSaleDetails = async () => {
    preSaleLive = await contract.methods.preSaleLive().call();
    publicSaleLive = await contract.methods.publicSaleLive().call();
    remainingSupply = await contract.methods.remainingSupply().call();

    if (preSaleLive) {
        maxMintCount = await contract.methods.preSaleLimitPerAddress().call();
        costPerNFT = await contract.methods.preSaleCost().call();
    } else if (publicSaleLive) {
        maxMintCount = await contract.methods.publicSaleLimitPerAddress().call();
        costPerNFT = await contract.methods.publicSaleCost().call();
    } else {
        setError("Sale is not live. Checkout Discord for details!");
    }
    $("#moodie-cost").text(costPerNFT / 1000000000000000000);
    $("#moodies-left").text(remainingSupply);
};

const mintMoodies = async () => {
    disableState();
    await getContract()
        .then(() => fetchSaleDetails())
        .then(() => getAccounts())
        .then(async (accounts) => {
            let mintStatus;
            const totalCost = costPerNFT * mintCount;
            
            if (preSaleLive) {
                if (whitelist[accounts[0]] === undefined) {
                    setError("This is a pre-sale! Looks like you are not on the whitelist. Please wait for the public sale!");
                    return;
                }
                mintStatus = contract.methods.mintPreSale(mintCount, whitelist[accounts[0]]).send({ 
                    from: accounts[0], 
                    gas: 200000,
                    value: totalCost
                });
            } else if (publicSaleLive) {
                mintStatus = contract.methods.mintPublicSale(mintCount).send({ 
                    from: accounts[0], 
                    gas: 200000,
                    value: totalCost
                });
            } else {
                return;
            }

            await mintStatus.then((success) => {
                $("#mint-error").hide();
                $("#mint-success").show();
                console.log(success);
            }).catch((error) => {
                setError(`Mint failed! ${error.message} Please retry!`);
                $("#mint-success").hide();
            }).finally(() => {
                enableState();
            }).then(() => fetchSaleDetails());
    }).catch(() => {
        setError("Please select the correct network in the Wallet!");
        enableState();
    });
}

async function moodiesMinter() {
    await addListeners()
        .then(() => getWeb3())
        .then(() => getContract())
        .then(() => fetchSaleDetails())
        .catch((error) => {
            console.log(`Error fetching initial details. ${error}`);
        })
}

moodiesMinter();