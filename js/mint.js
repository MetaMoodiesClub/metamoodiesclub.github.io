const contractAddress = "0x21381E9ef3024BA22E1CACe935a7662bC743af51";
const ethChain = "rinkeby"; //mainnet
const web3authSdk = window.Web3auth;

let torus;
let web3AuthInstance = null;
let mintCount = 1;
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

const getWeb3 = () => {
    return new Promise((resolve, reject) => {
        window.addEventListener("load", async () => {
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
                        defaultLanguage: "en",
                    },
                    network: {
                        host: ethChain
                    }
                })
                .then(async () => {
                    try {
                        await torus.logout();
                    } catch (error) {
                        // nothing
                    }
                    web3 = new Web3(torus.provider);
                    sendEvent("Web3 resolved");
                    resolve(web3);
                }).catch(error => {
                    reject(error);
                });
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
            sendEvent("Contract resolved");
            resolve(contract);
        } catch (error) {
            sendException("Contract not resolved");
            reject(error);
        }
    });
};

const getAccounts = async () => {
    return torus.login()
        .then(() => web3.eth.getAccounts());
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
        sendEvent("Connect wallet");
        $("#connect-metamask-button").text("Connecting...");
        getAccounts().then((accounts) => {
            console.log(accounts);
            $("#mint-counters").show();
            $("#mint-button").show();
            $("#connect-metamask-button").hide();
            $("#mint-error").hide();
            sendEvent("Wallet connected");
        }).catch((error) => {
            console.log(error);
            $("#mint-counters").hide();
            $("#mint-button").hide();
            $("#connect-metamask-button").show();
            setError("Error connecting to Metamask. Please try again!");
            sendException("Wallet not connected");
        }).finally(() => {
            $("#connect-metamask-button").text("Connect Wallet");
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
    await getContract()
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
    }).catch(() => {
        setError("Please select the correct network in the Wallet!");
        sendException("Incorrect network");
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