"use client";

import { useActionState } from "react";
import { sendContactMessage } from "./contact.action";

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(sendContactMessage, null);

  return (
    <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-5">
          <h1 className="font-headline-lg text-primary mb-4">Contact</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-12">
            Une question, une suggestion ou un probleme ? Notre equipe est la pour vous aider.
          </p>
          <div className="space-y-8">
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Email
              </span>
              <p className="font-body-md text-primary mt-1">support@exammarketplace.com</p>
            </div>
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Telephone
              </span>
              <p className="font-body-md text-primary mt-1">+237 6 90 00 00 00</p>
            </div>
            <div>
              <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                Adresse
              </span>
              <p className="font-body-md text-primary mt-1">Yaounde, Cameroun</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="bg-surface-container-lowest border border-outline-variant p-8 md:p-12">
            <h2 className="font-headline-sm text-primary mb-8 border-b border-outline-variant pb-4">
              Envoyez-nous un message
            </h2>
            <form action={formAction} className="space-y-6">
              {state?.success && (
                <div className="bg-secondary-container text-on-secondary-container font-body-sm p-3 border border-secondary/30">
                  Message envoye avec succes.
                </div>
              )}
              {[
                { label: "Nom complet", name: "name", type: "text" },
                { label: "Email", name: "email", type: "email" },
                { label: "Sujet", name: "subject", type: "text" },
              ].map((field) => (
                <div key={field.name} className="relative">
                  <label
                    htmlFor={field.name}
                    className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2"
                  >
                    {field.label}
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    required
                    className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors outline-none"
                  />
                </div>
              ))}
              <div className="relative">
                <label
                  htmlFor="message"
                  className="font-label-caps text-label-caps text-on-surface-variant uppercase block mb-2"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  className="w-full bg-transparent border-0 border-b border-outline-variant py-2 px-0 text-body-md text-primary focus:ring-0 focus:border-primary transition-colors outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary text-on-primary font-label-caps text-label-caps uppercase py-4 px-8 hover:bg-inverse-surface transition-colors disabled:opacity-70"
              >
                {isPending ? "Envoi..." : "Envoyer le message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
