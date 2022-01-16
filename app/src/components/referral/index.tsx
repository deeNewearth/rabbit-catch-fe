import { useState, useEffect, useMemo } from "react";
import { Form, Button, Spinner } from "react-bootstrap";
import './referral.scss';
import { useweb3Context } from '../web3';
import { IAsyncResult, ShowError, useQueryParams } from '../utils';

import { RabbitCreed } from '../../typechain/RabbitCreed';
import RabbitCreed_json from '../../typechain/RabbitCreed.json';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';

import { CopyToClipboard } from 'react-copy-to-clipboard';

export default function ReferralView() {

    const [code, setCode] = useState<string>('');
    const { chainInfo, account, web3 } = useweb3Context() || {};
    const [submitted, setSubmitted] = useState<IAsyncResult<string>>();

    const [withdrawing, setWithdrawing] = useState<IAsyncResult<string>>();

    const [urlCopied, setUrlCopied] = useState(false);

    const [existing, setExisting] = useState<IAsyncResult<{
        currentCode: string;
        paymentsWei: string;
        payments: string;
    }>>();

    const qParams = useQueryParams();

    const codeUrl = useMemo(() => {
        if (!existing?.result?.currentCode) {
            return null;
        }

        const sParams = new URLSearchParams();
        qParams['code'] = existing?.result?.currentCode;
        Object.keys(qParams).forEach(k => sParams.append(k, qParams[k]));

        const getUrl = window.location;
        var baseUrl = getUrl.protocol + "//" + getUrl.host +  '?' + sParams.toString();

        return baseUrl;

    }, [existing?.result?.currentCode]);

    async function loadExisting() {
        try {
            setExisting({ isLoading: true });


            if (!web3 || !chainInfo?.contracts?.rabbitCreed || !account) {
                throw new Error('web3 not yet initialized');

            }

            const rabbitCreed: RabbitCreed = new web3.eth.Contract(RabbitCreed_json.abi as any, chainInfo.contracts.rabbitCreed) as any;

            const currentCode = await rabbitCreed.methods.accountToCode(account).call();
            const paymentsWei = await rabbitCreed.methods.payments(account).call();
            const payments = web3.utils.fromWei(paymentsWei, "ether");

            if (!!currentCode) {
                setCode(currentCode);
            }

            setExisting({ result: { currentCode, paymentsWei, payments } });


        } catch (error: any) {
            setExisting({ error });
        }
    }

    useEffect(() => {

        loadExisting();

    }, [chainInfo, account, web3]);

    return <div className="refView">

        {!!existing?.isLoading && <Spinner animation='border' variant='primary' />}

        {!!existing?.error && <ShowError error={existing.error} />}

        <div className="my-4">

            <span>Your earned referral rewards is <strong>{existing?.result?.payments || '...'}</strong> BNB </span>
            <Button className="mx-2" variant="info" size="sm" disabled={!existing?.result?.payments || existing?.result?.payments === '0'} onClick={async () => {

                try {

                    if (!web3 || !chainInfo?.contracts?.rabbitCreed || !account) {
                        throw new Error('web3 not yet initialized');
                    }

                    if (!existing?.result?.payments || existing?.result?.payments === '0') {
                        throw new Error('no payment to withdraw');
                    }

                    setWithdrawing({ isLoading: true });

                    const rabbitCreed: RabbitCreed = new web3.eth.Contract(RabbitCreed_json.abi as any, chainInfo.contracts.rabbitCreed) as any;

                    const tx = await rabbitCreed.methods.withdrawPayments(account).send({
                        from: account,
                        to: chainInfo.contracts.rabbitCreed
                    });
                    setWithdrawing({ result: tx.transactionHash });

                    await loadExisting();

                } catch (error: any) {
                    setWithdrawing({ error });
                }

            }} >
                Claim reward
            </Button>

            {!!withdrawing?.isLoading && <div className='text-center'>
                    <Spinner animation='border' variant='info' />
                    <span className='text-success ms-1' >Waiting for wallet</span>

            </div>}


            {!!withdrawing?.error && <ShowError error={withdrawing.error} />}

            {!!withdrawing?.result && <div className="my-1 text-info"><small>Reward claimed with tx :{withdrawing?.result}</small> </div>}

        </div>


        <Form onSubmit={async (e) => {
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

                await loadExisting();
                setSubmitted({ result: `?code=${encodeURIComponent(code)}` });


            } catch (error: any) {
                setSubmitted({ error });
            }

        }}>
            <Form.Group className="mb-3" controlId="refBox">
                <Form.Label>{!!existing?.result?.currentCode ? 'Change referral code - will remove your old code' : 'Register referral code'} </Form.Label>
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

                <Button variant="primary" type="submit" className="px-5" disabled={!!submitted?.isLoading || !!existing?.isLoading}>
                    Submit code
                </Button>
            </div>
        </Form>

        {!!codeUrl && <div className="my-3">

            <span className="me-1">Your referral link is <i>{codeUrl}</i> </span>

            <CopyToClipboard text={codeUrl}
                onCopy={() => {
                    console.debug('url copied');
                    setUrlCopied(true);
                    setTimeout(() => setUrlCopied(false), 1000 * 5);
                }}>
                <Button variant="link"><FontAwesomeIcon icon={faCopy} /></Button>
            </CopyToClipboard>

            {urlCopied && <p className="text-info text-center"><small>link has been copied to clipboard</small></p>}

        </div>
        }

    </div>;

}