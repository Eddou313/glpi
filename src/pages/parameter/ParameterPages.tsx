import React, { useState } from "react";
import { TICKET_STATUS, type Parameter } from "../../types/parameter/parameter";
import { useParameter } from "../../hooks/parameter/useParameter";
import "./parameter.css"; 

export function ParameterPages() {
    const { createParameter } = useParameter();
    const [parameters, setParameters] = useState<Parameter | null>(null);
    const [mes , setMes] = useState<string>("");
    const [isError, setIsError] = useState<boolean>(false);

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
        if (!parameters?.technical_name) {
            setIsError(true);
            setMes("Veuillez sélectionner un statut.");
            return;
        }
        if(!parameters?.default_name_fr.trim() && !parameters?.name_mg.trim() && !parameters?.bg_color.trim()){
            setIsError(true);
            setMes("Veuillez remplir tous les champs avant de soumettre.");
            return;
        }
        try {
            const response = await createParameter(parameters as Parameter);
            setIsError(false);
            setMes("Paramètre créé avec succès : " + JSON.stringify(response.data));
            return;
        }
        catch(e : any)
        {
            setIsError(true);
            setMes("Erreur lors de la soumission du formulaire : " + e.message);
            return
        }
    };

    return (
        <div className="param-container">
            <div className="param-card">
                <h2 className="param-card-title">Paramètres</h2>
                
                {mes && (
                    <p className={`param-message ${isError ? "param-message--error" : "param-message--success"}`}>
                        {mes}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="param-form">
                    <div className="param-field">
                        <label htmlFor="statu" className="param-label">Statut actuel</label>
                        <select
                            id="statu"
                            className="param-input"
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

                    <div className="param-field">
                        <label htmlFor="fr" className="param-label">Nom français</label>
                        <input
                            type="text"
                            id="fr"
                            className="param-input"
                            value={parameters?.default_name_fr ?? ""}
                            onChange={(e) => handleFieldChange(parameters?.technical_name ?? 0, e.target.value, parameters?.name_mg ?? "", parameters?.bg_color ?? "#ffffff")}
                        />
                    </div>

                    <div className="param-field">
                        <label htmlFor="mg" className="param-label">Nom Malagasy</label>
                        <input
                            type="text"
                            id="mg"
                            className="param-input"
                            value={parameters?.name_mg ?? ""}
                            onChange={(e) => handleFieldChange(parameters?.technical_name ?? 0, parameters?.default_name_fr ?? "", e.target.value, parameters?.bg_color ?? "#ffffff")}
                        />
                    </div>

                    <div className="param-field">
                        <label htmlFor="color" className="param-label">Couleur de fond</label>
                        <div className="param-color-picker-wrapper">
                            <input
                                type="color"
                                id="color"
                                className="param-input-color"
                                value={parameters?.bg_color ?? "#ffffff"}
                                onChange={(e) => handleFieldChange(parameters?.technical_name ?? 0, parameters?.default_name_fr ?? "", parameters?.name_mg ?? "", e.target.value)}
                            />
                            <span className="param-color-value">{parameters?.bg_color ?? "#ffffff"}</span>
                        </div>
                    </div>

                    <div className="param-actions">
                        <button type="submit" className="param-button">
                            Appliquer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
export default ParameterPages;