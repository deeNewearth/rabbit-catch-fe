import { useEffect, useState } from 'react';
import { useweb3Context, useConnectCalls } from '../web3';
import { IAsyncResult, ShowError } from '../utils';
import { Spinner } from 'react-bootstrap';

import { RabbitCatchMaster } from '../../typechain/RabbitCatchMaster';
import RabbitCatchMaster_json from '../../typechain/RabbitCatchMaster.json';

import { Row, Col, Button } from 'react-bootstrap';

import './mint.scss';

export default function MintView() {

    const [mintState, setMintState] = useState<IAsyncResult<{
        canMint: Boolean;
        price: string;
        priceWei:string;
    }>>();

    const [submitted, setSubmitted] = useState<IAsyncResult<string>>();

    const { chainInfo, account, web3 } = useweb3Context() || {};

    const {reloadNFTs} = useConnectCalls();

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

                const canMint = await rabbitCache.methods.canMint(account).call();

                setMintState({ result: { canMint, price, priceWei } });


            } catch (error: any) {
                setMintState({ error });
            }
        })();

    }, [chainInfo, account, web3]);

    if (!!mintState?.isLoading) {
        return <Spinner animation="border" variant="primary" />;
    }

    if (!!mintState?.error) {
        return <ShowError error={mintState?.error} />
    }
    
    /*
    if in past do not show rabbitRocket
    uint32 public startEpoch; rabbit start in  10 sec from now
    uint32 public whitelistEndEpoch; public minting starts in  10 sec from now
    uint32 public endEpoch; might end in 30 hours from now

    from rabbitGreed .. address and check mark if belongw to current wallet
    title: rabbit Greed most mints
    address public first;
    address public second;
    address public third;

    */


    return <Row className='mint m-2 p-3'>
        <Col xs={4} >
            <div className="logo"></div>
        </Col>

        <Col xs={8} className="ps-3 mintInfo">
            <h2>Rabbit Chase</h2>
            <p>Current price: <strong>{mintState?.result?.price}</strong> BNB</p>

            {mintState?.result?.canMint?<div className="d-grid gap-2">

                {!!submitted?.isLoading && <div className='text-center'>
                     <Spinner animation='border' variant='success'/>
                     <span className='text-success ms-1' >Waiting for wallet</span>

                </div>}

                {!!submitted?.error && <ShowError error={submitted.error}/>}

                <Button disabled={!!submitted?.isLoading} variant="primary mintBtn" size="lg" onClick={async ()=>{
                    try{

                        if (!web3 || !chainInfo?.contracts?.rabbitMaster || !account) {
                            throw new Error('web3 not yet initialized');
                        }

                        if(!mintState?.result?.priceWei){
                            throw new Error('price is not yet determined');
                        }
        
                        setSubmitted({isLoading:true});

                        const rabbitCache: RabbitCatchMaster = new web3.eth.Contract(RabbitCatchMaster_json.abi as any, chainInfo.contracts.rabbitMaster) as any;
                                
                        const tx = await rabbitCache.methods.mint(account,'').send({
                            value:mintState?.result?.priceWei,
                            from:account,
                            to:chainInfo.contracts.rabbitMaster
                        });

                        await reloadNFTs();

                        setSubmitted({result:tx.transactionHash});


                    }catch(error:any){
                        setSubmitted({error});
                    }
                }}>
                    Mint
                </Button>
            </div>:<p className='text-warning'>Currently NOT mintable</p>
            }

            {!!submitted?.result && <div>
                minted with tx : {submitted?.result}
            </div>
            }

        </Col>

    </Row>;
}