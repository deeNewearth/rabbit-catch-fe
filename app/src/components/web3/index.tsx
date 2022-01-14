import { useEffect, useState } from "react";
import { useQueryParams, IAsyncResult, ShowError } from '../utils';

import { Spinner } from "react-bootstrap";
import {ChainInfo, Injectedweb3} from './injected';


//the default chain needs to be the first One
const supportedChains: ChainInfo[] = [
    { chainId:'56', name: 'Binance Smart Chain', hexChainId: '0x38', rpcProvider: 'https://bsc-dataseed.binance.org/' },
    { chainId:'97', name: 'bsc Testnet', hexChainId: '0x61', rpcProvider: 'https://data-seed-prebsc-1-s1.binance.org:8545/' }
];

export function Connect() {

    const qParams = useQueryParams();
    const [web3ctx, setWeb3Ctx] = useState<IAsyncResult<{
        injected?: any;
    }>>({isLoading:true});

    useEffect(() => {
        let injected: any = undefined;

        if (typeof window !== "undefined") {
            injected = (window as any)?.ethereum;
        }

        if (!injected) {
            console.log("no injected provider found");
            setWeb3Ctx({ result:{} });
            return;
        }

        const usingTestnet = qParams['network'] == 'test';
        console.log(`usingTestnet = ${usingTestnet}`);

        const chainInfo = supportedChains[usingTestnet?1:0];

        (async ()=>{
            try{

                const injected = new Injectedweb3();

                await injected.connect(chainInfo);

                throw new Error('not implemented');
            }catch(error:any){
                setWeb3Ctx({error});
            }

        })();

    }, []);

    if (!!web3ctx.isLoading) {
        return <div className="p-3"><Spinner animation="border" variant="primary" /></div>;
    }

    if(!!web3ctx?.error){
        return <ShowError error={web3ctx?.error}/>
    }

    if (web3ctx.result && !web3ctx.result.injected) {
        return <div className="text-center">
            <h2>No injected wallet found</h2>
            <p>We suggest installing <a href="https://metamask.io/download">Metamask</a></p>
        </div>;
    }

    return <div>ok </div>;



    /*
    return (
        <div>
          {`The current page is: ${qParams['network']||'unknown'}`}
          
        </div>
    );
    */
}
