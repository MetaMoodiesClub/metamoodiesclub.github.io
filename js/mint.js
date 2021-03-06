const contractAddress = "0x3B9c0540235Ca2018AB8012EE2be6E4B57198f2c";
const networkId = 4; // Rinkeby testnet
const networkName = "rinkeby";
let mintCount = 1;
let useTorus = true;
let torus;
let web3;
let contract;
let whitelist;

let preSaleLive = false;
let publicSaleLive = false;
let costPerNFT = 20000000000000000;
let maxMintCount = 3;
let remainingSupply = 1010;

const sendEvent = (action) => {
    gtag('event', action);
}

const sendEventValue = (action, value) => {
    gtag('event', action, { 'eventValue' : value });
}

const sendException = (error) => {
    sendEvent(error);
    gtag('event', 'exception', {
        'description': error,
        'fatal': false
    });
}

const initTorus = () => {
    torus = new Torus();
    return torus.init({
        showTorusButton: false,
        clientId: "BHRa4fTMnD-zuo91dEyYV_c1s_wOtEpGo7smos2LufU6Dl9rrGLqYRhcF2-3i-mnwVyG5nMBpyaqSRpjqISWl7Y",
        whiteLabel: {
            theme: {
                isDark: false,
                colors: {
                torusBrand1: "#4597C0",
                },
            },
            logoDark: "https://metamoodies.club/assets/favicon/android-chrome-512x512.png", // Dark logo for light background
            logoLight: "https://metamoodies.club/assets/favicon/android-chrome-512x512.png", // Light logo for dark background
            topupHide: true,
            featuredBillboardHide: true,
            disclaimerHide: true,
            tncLink: [],
            privacyPolicy:[],
            defaultLanguage: "en",
        },
        network: {
            host: networkName
        }
    });
}

const getWeb3 = () => {
    return new Promise((resolve, reject) => {
        if (useTorus) {
            web3 = new Web3(torus.provider);
        } else {
            if (window.ethereum) {
                web3 = new Web3(window.ethereum);
            } else {
                sendException("Wallet not installed");
                reject("Must install MetaMask");
            }
        }
        sendEvent("Web3 resolved");
        try {
            resolve(web3);
        } catch (error) {
            reject(error);
        }
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
            sendEvent("Contract resolved");
            console.log("Contract resolved");
            resolve(contract);
        } catch (error) {
            console.log(`Contract not resolved: ${error}`);
            sendException("Contract not resolved");
            reject(error);
        }
    });
};

const getAccounts = async () => {
    if (useTorus) {
        return web3.eth.getAccounts();
    } else {
        return window.ethereum.request({ method: "eth_requestAccounts" });
    }
}

const checkBalance = async () => {
    const balance = await web3.eth.getBalance((await getAccounts())[0]);
    console.log(`Balance is: ${balance}`);
    if (balance < mintCount * costPerNFT * 1.2) {
        setError(`Looks like your balance (${ (balance / 1000000000000000000).toPrecision(2) } ETH) is low! You should Topup before mint!`);
        $("#topup-wallet").show();
    }
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
        sendEvent("Connect wallet metamask");
        $("#connect-metamask-button").text("Connecting...");
        useTorus = false;
        getWeb3()
        .then(() => getAccounts())
        .then(() => getContract())
        .then(() => {
            $("#mint-counters").show();
            $("#mint-button").show();
            $("#connect-wallet-buttons").hide();
            $("#mint-error").hide();
            sendEvent("Wallet connected");
        }).catch((error) => {
            $("#mint-counters").hide();
            $("#mint-button").hide();
            $("#connect-wallet-buttons").show();
            setError("Error connecting to Metamask. Please try again!");
            sendException("Metamask connection failed");
        }).finally(async () => {
            $("#connect-metamask-button").text("Connect with Metamask");
        })
        .then(() => checkBalance());
    });
    $("#connect-torus-button").on("click", async (e) => {
        e.preventDefault();
        sendEvent("Connect wallet torus");
        $("#connect-torus-button").text("Connecting...");
        useTorus = true;
        getWeb3()
        .then(() => torus.login())
        .then(() => getContract())
        .then(() => {
            $("#mint-counters").show();
            $("#mint-button").show();
            $("#connect-wallet-buttons").hide();
            $("#mint-error").hide();
            sendEvent("Wallet connected");
        }).catch(() => {
            $("#mint-counters").hide();
            $("#mint-button").hide();
            $("#connect-wallet-buttons").show();
            setError("Error connecting to Torus. Please try again!");
            sendException("Torus connection failed");
        }).finally(async () => {
            $("#connect-torus-button").text("Connect with Email");
        })
        .then(() => checkBalance());
    });
    $("#topup-wallet").on("click", async (e) => {
        return torus.initiateTopup("wyre", {
            fiatValue: mintCount * 100,
            selectedCryptoCurrency: "ETH",
            selectedAddress: (await getAccounts())[0],
        });
    });
    $("#mint-count-minus").on("click", async (e) => {
        e.preventDefault();
        if (mintCount > 1) mintCount--;
        sendEventValue("Mint count minus", mintCount);
        updateMintCountText();
    });
    $("#mint-count-plus").on("click", async (e) => {
        e.preventDefault();
        if (mintCount < maxMintCount) mintCount++;
        sendEventValue("Mint count plus", mintCount);
        updateMintCountText();
    });
    $("#mint-button").on("click", async (e) => {
        e.preventDefault();
        sendEventValue("Mint", mintCount);
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
    await checkBalance() 
        .then(() => fetchSaleDetails())
        .then(() => getAccounts())
        .then(async (accounts) => {
            let mintStatus;
            const totalCost = costPerNFT * mintCount;
            
            if (preSaleLive) {
                if (whitelist[accounts[0]] === undefined) {
                    setError("This is a pre-sale! Looks like you are not on the whitelist. Please wait for the public sale!");
                    enableState();
                    sendException("Not on whitelist");
                    return;
                }
                sendEvent("Pre sale mint");
                mintStatus = contract.methods.mintPreSale(mintCount, whitelist[accounts[0]]).send({ 
                    from: accounts[0], 
                    gas: 200000,
                    value: totalCost
                });
            } else if (publicSaleLive) {
                sendEvent("Public sale mint");
                mintStatus = contract.methods.mintPublicSale(mintCount).send({ 
                    from: accounts[0], 
                    gas: 200000,
                    value: totalCost
                });
            } else {
                enableState();
                return;
            }

            await mintStatus.then((success) => {
                $("#mint-error").hide();
                $("#mint-success").show();
                sendEvent("Mint success");
                console.log(success);
            }).catch((error) => {
                setError(`Mint failed! ${error.message} Please retry!`);
                $("#mint-success").hide();
                sendException("Mint failed");
            }).finally(() => {
                enableState();
            }).then(() => fetchSaleDetails());
    }).catch((error) => {
        console.log(error);
        setError("Please select the correct network in the Wallet!");
        sendException("Incorrect network");
        enableState();
    });
}

async function moodiesMinter() {
    await addListeners()
        .then(() => initTorus())
        .then(() => getWeb3())
        .then(() => getContract())
        .then(() => fetchSaleDetails())
        .catch((error) => {
            console.log(`Error fetching initial details. ${error}`);
        })
}

moodiesMinter();