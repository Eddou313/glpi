import React, { useState } from "react";
import { TICKET_STATUS, type Parameter } from "../../types/parameter/parameter";
import { useParameter } from "../../hooks/parameter/useParameter";

export function ParameterPages() {
    const { createParameter } = useParameter();
    const [parameters, setParameters] = useState<Parameter | null>(null);
    const [mes , setMes] = useState<string>("");
    const handleFieldChange = (
        technical_name: number,
        default_name_fr: string,
        name_mg: string,
        bg_color: string
    ) => {
        setParameters((prev) => ({
            id: prev?.id ?? 0,
            technical_name,
            default_name_fr,
            name_mg,
            bg_color,
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (parameters?.technical_name === null) {
            setMes("Veuillez sélectionner un statut.");
            return;
        }
        if(parameters?.default_name_fr.trim() === "" && parameters?.name_mg.trim() === "" && parameters?.bg_color.trim() === ""){
            setMes("Veuillez remplir tous les champs avant de soumettre.");
            return;
        }
        try {
            const response = await createParameter(parameters as Parameter);
            setMes("Paramètre créé avec succès : " + JSON.stringify(response.data));
            return;
        }
        catch(e : any)
        {
            setMes("Erreur lors de la soumission du formulaire : " + e.message);
            return
        }
    };

    return (
        <div>
            <h2>Paramètres</h2>
            <p>{mes}</p>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="statu">Statut actuel</label>

                    <select
                        id="statu"
                        value={parameters?.technical_name ?? ""}
                        onChange={(e) => handleFieldChange(Number(e.target.value), parameters?.default_name_fr ?? "", parameters?.name_mg ?? "", parameters?.bg_color ?? "#ffffff")}
                    >
                        <option value="">-- Choisir le statut --</option>
                        {Object.entries(TICKET_STATUS).map(([name, id]) => (
                            <option key={id} value={id}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="fr">Nom français</label>

                    <input
                        type="text"
                        id="fr"
                        value={parameters?.default_name_fr ?? ""}
                        onChange={(e) => handleFieldChange(parameters?.technical_name ?? 0, e.target.value, parameters?.name_mg ?? "", parameters?.bg_color ?? "#ffffff")}
                    />
                </div>

                <div>
                    <label htmlFor="mg">Nom malgache</label>
                    <input
                        type="text"
                        id="mg"
                        value={parameters?.name_mg ?? ""}
                        onChange={(e) => handleFieldChange(parameters?.technical_name ?? 0, parameters?.default_name_fr ?? "", e.target.value, parameters?.bg_color ?? "#ffffff")}
                    />
                </div>

                <div>
                    <label htmlFor="color">Couleur de fond</label>
                    <input
                        type="color"
                        id="color"
                        value={parameters?.bg_color ?? "#ffffff"}
                        onChange={(e) => handleFieldChange(parameters?.technical_name ?? 0, parameters?.default_name_fr ?? "", parameters?.name_mg ?? "", e.target.value)}
                    />
                </div>

                <button type="submit">
                    Appliquer
                </button>
            </form>
        </div>
    );
}
export default ParameterPages;