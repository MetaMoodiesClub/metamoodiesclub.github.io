const contractAddress = "0x15E94A0ad5F135fe08905D752f1D400E2F10eDBC";
const networkId = 4; // Rinkeby testnet
let mintCount = 1;
let web3;
let contract;
let whitelist;

let preSaleLive = false;
let publicSaleLive = false;
let maxMintCount = 3;

const getWeb3 = () => {
    return new Promise((resolve, reject) => {
        window.addEventListener("load", async () => {
            if (window.ethereum) {
                const web3 = new Web3(window.ethereum);
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
    const data = await $.getJSON("./contract/MetaMoodiesClub.json");
    whitelist = await $.getJSON("./contract/whitelist.json");
    const moodiesContract = new web3.eth.Contract(
        data.abi,
        contractAddress
    );
    return moodiesContract;
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

// Add listeners for button
const addListeners = async () => {
    mintCount = 1;
    $("#connect-metamask-button").on("click", async (e) => {
        e.preventDefault();
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

    if (preSaleLive) {
        maxMintCount = await contract.methods.preSaleLimitPerAddress().call();
    } else if (publicSaleLive) {
        maxMintCount = await contract.methods.publicSaleLimitPerAddress().call();
    } else {
        setError("Sale is not live. Checkout Discord for details!");
    }
};

const mintMoodies = async () => {
    await fetchSaleDetails();
    const fromAddr = (await getAccounts())[0];
    let mintStatus;
    
    if (preSaleLive) {
        if (whitelist[fromAddr] === undefined) {
            setError("This is a pre-sale! Looks like you are not on the whitelist. Please wait for the public sale!");
            return;
        }
        const costPerNFT = await contract.methods.preSaleCost().call();
        const totalCost = costPerNFT * mintCount;
        mintStatus = contract.methods.mintPreSale(mintCount, whitelist[fromAddr]).send({ 
            from: fromAddr, 
            gas: 200000,
            value: totalCost
        });
    } else if (publicSaleLive) {
        const costPerNFT = await contract.methods.publicSaleCost().call();
        const totalCost = costPerNFT * mintCount;
        mintStatus = contract.methods.mintPublicSale(mintCount).send({ 
            from: fromAddr, 
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
    });
}

async function moodiesMinter() {
    web3 = await getWeb3();
    contract = await getContract(web3);

    await fetchSaleDetails(contract);
    await addListeners();
}

moodiesMinter();