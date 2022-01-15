import { useEffect, useState } from 'react';
import { useweb3Context, useConnectCalls } from '../web3';
import { IAsyncResult, ShowError, useQueryParams } from '../utils';
import { Spinner } from 'react-bootstrap';

import { RabbitCatchMaster } from '../../typechain/RabbitCatchMaster';
import RabbitCatchMaster_json from '../../typechain/RabbitCatchMaster.json';

import { Row, Col, Button } from 'react-bootstrap';

import TimesView from './times';
import WinnersView from './winners';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';


import './mint.scss';

const _refCodeStore ="lastRefcode";

export default function MintView() {

    const [mintState, setMintState] = useState<IAsyncResult<{
        canMint: Boolean;
        price: string;
        priceWei: string;
        mintCount:string;mintCountMax:string;
    }>>();

    const [submitted, setSubmitted] = useState<IAsyncResult<string>>();

    const { chainInfo, account, web3 } = useweb3Context() || {};

    const { reloadNFTs } = useConnectCalls();

    const qParams = useQueryParams();

    const [referralCode, setReferralCode] = useState<string>('');

    useEffect(()=>{

        const refCode = qParams['code'] ||'';

        if(!!refCode){
            console.debug('using ref code from url');
            setReferralCode( refCode);
            localStorage?.setItem(_refCodeStore,refCode);
        }else{

            const savedOne = localStorage?.getItem(_refCodeStore);
            if(!!savedOne){
                console.debug('using ref code from localstorage');
                setReferralCode( savedOne);
            }
        }

    },[]);

    useEffect(() => {

        (async () => {
            try {
                setMintState({ isLoading: true });


                if (!web3 || !chainInfo?.contracts?.rabbitMaster || !account) {
                    throw new Error('web3 not yet initialized');

                }

                const rabbitCache: RabbitCatchMaster = new web3.eth.Contract(RabbitCatchMaster_json.abi as any, chainInfo.contracts.rabbitMaster) as any;

                const priceWei = await rabbitCache.methods.getPrice().call();
                const price = web3.utils.fromWei(priceWei, "ether");

                const mintCount = await rabbitCache.methods.mintCount().call();
                const mintCountMax = await rabbitCache.methods.mintCountMax().call();

                const canMint = await rabbitCache.methods.canMint(account).call();

                setMintState({ result: { canMint, price, priceWei, mintCount,  mintCountMax} });


            } catch (error: any) {
                setMintState({ error });
            }
        })();

    }, [chainInfo, account, web3]);

    return <Row className='mint m-2 p-3'>
        <Col xs={4} >
            <div className="logo"></div>
        </Col>

        <Col xs={8} className="ps-3 mintInfo">

            <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">

                <div>
                    <h2>Rabbit Chase</h2>

                    {!!mintState?.isLoading && <Spinner animation="border" variant="primary" />}

                    {!!mintState?.error && <ShowError error={mintState?.error} />}

                    <p>Current price: <strong>{mintState?.result?.price || " ... "}</strong> BNB</p>

                    <p className='mintCount mb-3'>mint count {mintState?.result?.mintCount} of {mintState?.result?.mintCountMax}</p>
                    <TimesView />
                </div>

                <WinnersView />

            </div>


            {!!mintState?.result && <>
                {mintState?.result?.canMint ? <div className="d-grid gap-2 my-2">

                    {!!submitted?.isLoading && <div className='text-center'>
                        <Spinner animation='border' variant='success' />
                        <span className='text-success ms-1' >Waiting for wallet</span>

                    </div>}

                    {!!submitted?.error && <ShowError error={submitted.error} />}

                    {!!referralCode && <div className='refCode'>
                        <span>Using referral code : <span className='text-info'>{referralCode}</span></span>
                        <Button variant='link' className="ms-2" onClick={()=>{
                            setReferralCode('');
                            localStorage?.removeItem(_refCodeStore);
                        }}> <FontAwesomeIcon className="text-warning" icon={faTrashAlt}  /></Button>
                    </div>
                    }

                    <Button disabled={!!submitted?.isLoading} variant="primary mintBtn" size="lg" onClick={async () => {
                        try {

                            if (!web3 || !chainInfo?.contracts?.rabbitMaster || !account) {
                                throw new Error('web3 not yet initialized');
                            }

                            if (!mintState?.result?.priceWei) {
                                throw new Error('price is not yet determined');
                            }

                            setSubmitted({ isLoading: true });

                            const rabbitCache: RabbitCatchMaster = new web3.eth.Contract(RabbitCatchMaster_json.abi as any, chainInfo.contracts.rabbitMaster) as any;

                            const tx = await rabbitCache.methods.mint(account, referralCode||'').send({
                                value: mintState?.result?.priceWei,
                                from: account,
                                to: chainInfo.contracts.rabbitMaster
                            });

                            await reloadNFTs();

                            setSubmitted({ result: tx.transactionHash });


                        } catch (error: any) {
                            setSubmitted({ error });
                        }
                    }}>
                        Mint
                    </Button>
                </div> : <p className='text-warning'>Currently NOT mintable</p>
                }

                {!!submitted?.result && <div>
                    minted with tx : {submitted?.result}
                </div>
                }
            </>
            }


        </Col>

    </Row>;
}