import { useEffect, useState } from 'react';
import { useweb3Context } from '../web3';
import { IAsyncResult, ShowError } from '../utils';
import { Spinner } from 'react-bootstrap';

import { CZodiacNFT } from '../../typechain/CZodiacNFT';
import CZodiacNFT_json from '../../typechain/CZodiacNFT.json';

//import { RabbitCatchMaster } from '../../typechain/RabbitCatchMaster';
//import RabbitCatchMaster_json from '../../typechain/RabbitCatchMaster.json';


export default function OwnedView() {

    const [ownedState, setOwnedState] = useState<IAsyncResult<{tokenId:string;tokenUri:string;}[]>>();

    const { chainInfo, account, web3, mintCount } = useweb3Context() || {};

    useEffect(() => {

        (async () => {
            try {
                setOwnedState({ isLoading: true });


                if (!web3 || !chainInfo?.contracts?.rabbitMaster || !account) {
                    console.debug('web3 not yet initialized');
                    return;
                }

                /*
                const rabbitCache: RabbitCatchMaster = new web3.eth.Contract(RabbitCatchMaster_json.abi as any, chainInfo.contracts.rabbitMaster) as any;

                const nftAddress = await rabbitCache.methods.czodiacNFT().call();
                console.log(`nftAddress :${nftAddress}`);

                const rabbitRocket = await rabbitCache.methods.rabbitRocket().call();
                console.log(`rabbitRocket :${rabbitRocket}`);

                const rabbitGreed = await rabbitCache.methods.rabbitGreed().call();
                console.log(`rabbitGreed :${rabbitGreed}`);

                const rabbitCreed = await rabbitCache.methods.rabbitCreed().call();
                console.log(`rabbitCreed :${rabbitCreed}`);
                //const nft: CZodiacNFT = new web3.eth.Contract(CZodiacNFT_json.abi as any, nftAddress) as any;
                */

                const nft: CZodiacNFT = new web3.eth.Contract(CZodiacNFT_json.abi as any, chainInfo.contracts.czodiacNFT) as any;

                const balance = Number.parseInt( await nft.methods.balanceOf(account).call());

                console.debug(`balance is ${balance}`);

                const result = balance?  await Promise.all( Array.from( Array(balance).keys()).map(async i=>{
                    const tokenId = await nft.methods.tokenOfOwnerByIndex(account,i).call();
                    const tokenUri  = await nft.methods.tokenURI(tokenId).call();

                    return {tokenId, tokenUri};
                })):[];

                setOwnedState({result});

            } catch (error: any) {
                setOwnedState({ error });
            }
        })();

    }, [chainInfo, account, web3, mintCount]);

    if (!!ownedState?.isLoading) {
        return <Spinner animation="border" variant="primary" />;
    }

    if (!!ownedState?.error) {
        return <ShowError error={ownedState?.error} />
    }

    if(0 === ownedState?.result?.length||0){
        return <h3 className='text-warning'>You don't own any</h3>;
    }


    return <div>
        <h3>You own</h3>
        {(ownedState?.result||[]).map(o=><div key={o.tokenId}>
            tokenId  {o.tokenId} ({o.tokenUri})
        </div>)}
    </div>; 
    
    

}