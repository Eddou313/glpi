import { api } from "../../api/https";
import type { Parameter } from "../../types/parameter/parameter";

export function useParameter() {
    const createParameter = async (parameter:Parameter) =>
    {
        try {
            const  reponse = await api.post("/Parameter", parameter);
            return reponse.data;
        }
        catch(erreur : any)
        {
            console.log("Erreur lors de la création du paramètre : " + erreur.message);
            throw new Error("Erreur lors de la création du paramètre : " + erreur.message);
        }
    }
    async function get(): Promise <Parameter | null>
    {
        try {
            const  reponse = await api.get("/Parameter/Parameters");
            return reponse.data;
        }
        catch(erreur : any)
        {
            console.log("Erreur lors de la recuperation des paramètre : " + erreur.message);
            throw new Error("Erreur lors de la recuperation des paramètre : " + erreur.message);
        }
    }
    const getAllParameter = get();
    return{createParameter,getAllParameter};
}
