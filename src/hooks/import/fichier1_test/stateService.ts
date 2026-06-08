import { useState } from "react";

export interface GLPIstate
{
    id : number,
    name:string,
    
}
export function stateService()
{
    const [stateAll,setStateAll] = useState();
}
export default stateService;