


export function ShowAddress({address}:{address:string}){

    if(!address)
        return null;

    const begin = address.substring(0,5);
    const end = address.substring(address.length -3);

    return <div className="d-flex flex-row justify-content-center">
        <span>{begin}...{end}</span>

    </div>;
}