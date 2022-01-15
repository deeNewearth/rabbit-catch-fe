import { useEffect, useState } from 'react';
import { useweb3Context } from '../web3';
import { IAsyncResult, ShowError } from '../utils';
import { Spinner } from 'react-bootstrap';

import { RabbitGreed } from '../../typechain/RabbitGreed';
import RabbitGreed_json from '../../typechain/RabbitGreed.json';

import { ShowAddress } from '../utils/display';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCertificate, faCrown } from '@fortawesome/free-solid-svg-icons';



export default function WinnersView() {

    const [winners, setWinners] = useState<IAsyncResult<{
        address: string;
        color: string;
    }[]>>();

    const { chainInfo, account, web3 } = useweb3Context() || {};

    useEffect(() => {

        (async () => {
            try {
                setWinners({ isLoading: true });


                if (!web3 || !chainInfo?.contracts?.rabbitGreed || !account) {
                    throw new Error('web3 not yet initialized');

                }

                const rabbitGreed: RabbitGreed = new web3.eth.Contract(RabbitGreed_json.abi as any, chainInfo.contracts.rabbitGreed) as any;

                const first = await rabbitGreed.methods.first().call();
                const second = await rabbitGreed.methods.second().call();
                const third = await rabbitGreed.methods.third().call();

                const result = [
                    { address: first, color: '#FFD700' },
                    { address: second, color: '#C0C0C0' },
                    { address: third, color: '#CD7F32' }
                ];

                setWinners({ result });

                console.log(`first ${first}, account: ${account}`);


            } catch (error: any) {
                setWinners({ error });
            }
        })();

    }, [chainInfo, account, web3]);


    return <div className='winnersView text-center'>

        <h6>Rabbit greed most mints</h6>
        {!!winners?.isLoading && <Spinner animation="border" variant="info" />}

        {!!winners?.error && <ShowError error={winners?.error} />}

        {(winners?.result || []).map((s, i) => <div key={i} className='winnerItem d-flex align-items-center justify-content-center gap-3 my-2'>
            <div className="certHolder">
                <FontAwesomeIcon className="certback" icon={faCertificate} style={{ color: s.color }} />
                <span className="score">{i + 1}</span>

                {s.address.toUpperCase() == account?.toUpperCase() && <FontAwesomeIcon className='owned' icon={faCrown}/>}

            </div>
            <ShowAddress address={s.address} />
        </div>
        )}
    </div>;


}