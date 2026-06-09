import { api } from "../../api/https";
import type { Parameter } from "../../types/parameter/parameter";

export function useParameter() {
    const createParameter = async (parameter:Parameter) =>
    {
        try {
            const  reponse = await api.post("/Parameter", parameter);
            return reponse;
        }
        catch(erreur : any)
        {
            console.log("Erreur lors de la création du paramètre : " + erreur.message);
            throw new Error("Erreur lors de la création du paramètre : " + erreur.message);
        }
    }
    return{createParameter};
}
