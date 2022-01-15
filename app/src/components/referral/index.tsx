import { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import './referral.scss';
import { useweb3Context } from '../web3';
import { IAsyncResult, ShowError } from '../utils';

import { RabbitCreed } from '../../typechain/RabbitCreed';
import RabbitCreed_json from '../../typechain/RabbitCreed.json';


export default function ReferralView() {

    const [code, setCode] = useState<string>('');
    const { chainInfo, account, web3 } = useweb3Context() || {};
    const [submitted, setSubmitted] = useState<IAsyncResult<string>>();


    return <Form className="refView" onSubmit={async (e)=>{
        e.preventDefault();

        try {

            if (!web3 || !chainInfo?.contracts?.rabbitCreed || !account) {
                throw new Error('web3 not yet initialized');
            }

            if (!code) {
                throw new Error('code is required');
            }

            setSubmitted({ isLoading: true });

            const rabbitCreed: RabbitCreed = new web3.eth.Contract(RabbitCreed_json.abi as any, chainInfo.contracts.rabbitCreed) as any;

            const tx = await rabbitCreed.methods.register(code).send({
                from: account,
                to: chainInfo.contracts.rabbitCreed
            });

            setSubmitted({ result: `?code=${encodeURIComponent(code)}` });


        } catch (error: any) {
            setSubmitted({ error });
        }

    }}>
        <Form.Group className="mb-3" controlId="refBox">
            <Form.Label>Register referral code</Form.Label>
            <Form.Control required placeholder="Enter any code" className="codeBox" value={code} onChange={e => setCode(e.target.value)} />
            {/*<Form.Text className="text-muted">
        We'll never share your email with anyone else.
        </Form.Text>*/}
        </Form.Group>

        <div className="text-center">

            {!!submitted?.isLoading && <div className='text-center'>
                <Spinner animation='border' variant='success' />
                <span className='text-success ms-1' >Waiting for wallet</span>

            </div>}

            {!!submitted?.error && <ShowError error={submitted.error} />}

            <Button variant="primary" type="submit" className="px-5" disabled={!!submitted?.isLoading}>
                Submit
            </Button>
        </div>

        {submitted?.result && <div className="text-center my-3">
            Code registered. Can be invoked with <code>{submitted?.result}</code>{}
        </div>}

    </Form>;

}