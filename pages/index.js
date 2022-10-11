import abi from '../utils/GetSponsor.json';
import { ethers } from 'ethers';
import Head from 'next/head';
// import Image from 'next/image'
import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
  // Contract Address & ABI
  const contractAddress = '0x60699721AC86604e16582a00c9efC1D79b743767';
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [memos, setMemos] = useState([]);

  function toDate(unixTimestamp) {
    return Date(unixTimestamp * 1000);
  }

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  };

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      console.log('accounts: ', accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log('wallet is connected! ' + account);
      } else {
        console.log('make sure MetaMask is connected');
      }
    } catch (error) {
      console.log('error: ', error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('please install MetaMask');
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const sendTip = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, 'any');
        const signer = provider.getSigner();
        const getSponsor = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log('Sent ETH..');
        const sponsorTxn = await getSponsor.sponsor(
          name ? name : 'anon',
          message ? message : 'Enjoy your tip!',
          { value: ethers.utils.parseEther('0.001') }
        );

        await sponsorTxn.wait();

        console.log('mined ', sponsorTxn.hash);

        console.log('Sent tip!');

        // Clear the form fields.
        setName('');
        setMessage('');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withDraw = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, 'any');
        const signer = provider.getSigner();
        const getSponsor = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log('Withdrawing ETH..');
        const withdrawTxn = await getSponsor.withdrawSponsorship();
        await withdrawTxn.wait();

        console.log('mined ', withdrawTxn.hash);

        console.log('Withdrew ETH!');
      }
    } catch (error) {
      console.log(error);
    }
  };
  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const getSponsor = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log('fetching memos from the blockchain..');
        let memos = await getSponsor.getMemos();
        console.log('fetched!');
        // memos.map((memo) => {
        //   memo.timestamp = toDate(memo.timestamp);
        // });
        setMemos(memos);
        // getSponsor.getOwner();
      } else {
        console.log('Metamask is not connected');
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let getSponsor;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log('Memo received: ', from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name,
        },
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, 'any');
      const signer = provider.getSigner();
      getSponsor = new ethers.Contract(contractAddress, contractABI, signer);

      getSponsor.on('NewMemo', onNewMemo);
    }

    return () => {
      if (getSponsor) {
        getSponsor.off('NewMemo', onNewMemo);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Sponsor Prashant Paidi!</title>
        <meta name='description' content='Tipping site' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className={styles.main}>
        {currentAccount ? (
          currentAccount.toString() ==
          '0x266cba21618743e740ae69913548034627f9f28b' ? (
            <div className=''>
              <h1>Hello Prashant</h1>

              <button onClick={withDraw}>Withdraw</button>
            </div>
          ) : (
            <div>
              <h1 className={styles.title}>
                Become a sponsor to <b>Prashant Paidi</b>!
              </h1>
              <form className={styles.centerElement}>
                <div>
                  <label>Name</label>
                  <br />

                  <input
                    id='name'
                    type='text'
                    placeholder='anon'
                    onChange={onNameChange}
                  />
                </div>
                <br />
                <div>
                  <label>Send Prashant a message</label>
                  <br />

                  <textarea
                    rows={3}
                    placeholder='Enjoy your tip!'
                    id='message'
                    onChange={onMessageChange}
                    required
                  ></textarea>
                </div>
                <div>
                  <button type='button' onClick={sendTip}>
                    Send tip 0.001ETH
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          <button onClick={connectWallet}> Connect your wallet </button>
        )}
      </main>

      {currentAccount && <h1>Memos received</h1>}

      {currentAccount &&
        memos.map((memo, idx) => {
          const dateAndTime = new Date(memo.timestamp * 1000).toString();
          return (
            <div
              key={idx}
              style={{
                border: '2px solid',
                borderRadius: '5px',
                padding: '5px',
                margin: '5px',
              }}
            >
              <p style={{ fontWeight: 'bold' }}>"{memo.message}"</p>
              <p>
                {/* {console.log(Date(memo.timestamp) + memo.timestamp)} */}
                From: {memo.name}
              </p>
              <p>Time: {dateAndTime}</p>
            </div>
          );
        })}

      <footer className={styles.footer}>
        <a
          href='https://github.com/prashantpaidi'
          target='_blank'
          rel='noopener noreferrer'
        >
          Created by Prashant Paidi as learning project!
        </a>
      </footer>
    </div>
  );
}
