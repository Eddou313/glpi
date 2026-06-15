import React, { useState } from "react";
import { TICKET_STATUS, type Parameter } from "../../types/parameter/parameter";
import { useParameter } from "../FrontOffice/Tickets/parameter/useParameter";
import "./parameter.css"; 

export function ParameterPages() {
    const { createParameter } = useParameter();
    
    const [parameters, setParameters] = useState<Parameter>({
        id: 0,
        technical_name: 0,
        default_name_fr: "",
        name_mg: "",
        bg_color: ""
    });
    
    const [mes , setMes] = useState<string>("");
    const [isError, setIsError] = useState<boolean>(false);

    const handleFieldChange = (field: keyof Parameter, value: any) => {
        setParameters((prev) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!parameters.technical_name) {
            setIsError(true);
            setMes("Veuillez sélectionner un statut.");
            return;
        }
        
        if (!parameters.default_name_fr.trim() && !parameters.name_mg.trim() && !parameters.bg_color.trim()) {
            setIsError(true);
            setMes("Veuillez remplir au moins une valeur.");
            return;
        }

        try {
            const reponse = await createParameter(parameters);
            alert("Paramètre enregistré avec succès pour : " + reponse.technical_name);
            window.location.reload();
        }
        catch(e : any) {
            alert("Erreur lors de la soumission du formulaire : " + e.message);
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
                    
                    {/* Select Statut */}
                    <div className="param-field">
                        <label htmlFor="statu" className="param-label">Statut actuel</label>
                        <select
                            id="statu"
                            className="param-input"
                            value={parameters.technical_name || ""}
                            onChange={(e) => handleFieldChange("technical_name", Number(e.target.value))}
                        >
                            <option value="">-- Choisir le statut --</option>
                            {Object.entries(TICKET_STATUS).map((status) => (
                                /* FIX: value doit être l'ID numérique (status[1]), le texte affiché est status[0] */
                                <option key={status[1]} value={status[1]}>
                                    {status[0]}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Input Français */}
                    <div className="param-field">
                        <label htmlFor="fr" className="param-label">Nom français</label>
                        <input
                            type="text"
                            id="fr"
                            className="param-input"
                            value={parameters.default_name_fr}
                            onChange={(e) => handleFieldChange("default_name_fr", e.target.value)}
                        />
                    </div>

                    {/* Input Malagasy */}
                    <div className="param-field">
                        <label htmlFor="mg" className="param-label">Nom Malagasy</label>
                        <input
                            type="text"
                            id="mg"
                            className="param-input"
                            value={parameters.name_mg}
                            onChange={(e) => handleFieldChange("name_mg", e.target.value)}
                        />
                    </div>

                    {/* Section Couleur avec option "+" */}
                    <div className="param-field">
                        <label htmlFor="color" className="param-label">Couleur de fond</label>
                        <div className="param-color-picker-wrapper">
                            {parameters.bg_color ? (
                                <>
                                    <input
                                        type="color"
                                        id="color"
                                        className="param-input-color"
                                        value={parameters.bg_color}
                                        onChange={(e) => handleFieldChange("bg_color", e.target.value)}
                                    />
                                    <span className="param-color-value">{parameters.bg_color}</span>
                                    <button 
                                        type="button" 
                                        className="param-color-remove-btn"
                                        onClick={() => handleFieldChange("bg_color", "")}
                                    >
                                        ✕
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    className="param-add-color-btn"
                                    onClick={() => handleFieldChange("bg_color", "#ffffff")}
                                >
                                    + Ajouter une couleur
                                </button>
                            )}
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