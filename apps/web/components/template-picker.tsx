"use client";

import { BUILDER_TEMPLATES } from "../lib/builder-templates";

interface TemplatePickerProps {
  open:boolean;
  busy:boolean;
  error:string|null;
  onClose:()=>void;
  onChoose:(templateId:string|"scratch")=>void;
}

export function TemplatePicker({open,busy,error,onClose,onChoose}:TemplatePickerProps) {
  if(!open)return null;
  return <div className="template-overlay">
    <section className="template-dialog" role="dialog" aria-modal="true" aria-labelledby="template-title">
      <div className="template-dialog-head">
        <div>
          <span className="template-kicker">Starter builds</span>
          <h2 id="template-title">Choose a starting point</h2>
          <p>Load a compatible build, then swap any part you want.</p>
        </div>
        <button className="template-close" onClick={onClose} disabled={busy} aria-label="Close templates">×</button>
      </div>
      <div className="template-grid">
        {BUILDER_TEMPLATES.map((template)=><button
          className="template-card" type="button" key={template.id}
          onClick={()=>onChoose(template.id)} disabled={busy}
        >
          <span className="template-card-label">Ready build</span>
          <strong>{template.title}</strong>
          <span className="template-card-copy">{template.description}</span>
          <span className="template-highlights">
            {template.highlights.map((highlight)=><span key={highlight}>{highlight}</span>)}
          </span>
          <span className="template-card-action">Use this template →</span>
        </button>)}
        <button className="template-card template-card-scratch" type="button"
          onClick={()=>onChoose("scratch")} disabled={busy}>
          <span className="template-card-label">Blank canvas</span>
          <strong>Start from scratch</strong>
          <span className="template-card-copy">Begin with an empty builder and choose every component yourself.</span>
          <span className="template-card-action">Open empty builder →</span>
        </button>
      </div>
      {busy?<p className="template-status" role="status">Loading catalog parts…</p>:null}
      {error?<p className="template-error" role="alert">{error}</p>:null}
    </section>
  </div>;
}
