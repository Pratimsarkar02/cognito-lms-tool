import React from "react";
import {
  Mail,
  Phone,
  MapPin,
  HelpCircle,
  Book,
  FileText,
  Users,
} from "lucide-react";

import instagramIcon from "../assets/socials/instagram.svg";
import xIcon from "../assets/socials/x.svg";
import facebookIcon from "../assets/socials/facebook.svg";
import linkedinIcon from "../assets/socials/linkedin.svg";
const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: facebookIcon,
  },
  {
    label: "X",
    href: "https://x.com",
    icon: xIcon,
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: instagramIcon,
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: linkedinIcon,
  },
];

const quickLinks = [
  { label: "Help Center", href: "#", Icon: HelpCircle },
  { label: "Courses", href: "#", Icon: Book },
  { label: "Resources", href: "#", Icon: FileText },
  { label: "Community", href: "#", Icon: Users },
];

const contactItems = [
  {
    label: "help.cognito@gmail.com",
    href: "https://mail.google.com/mail/?view=cm&fs=1&to=help.cognito@gmail.com",
    Icon: Mail,
  },
  {
    label: "+91 99325-66274",
    href: "tel:+919932566274",
    Icon: Phone,
  },
  { label: "Kolkata, India", Icon: MapPin },
];

const Footer = () => {
  return (
    <footer className="mt-12 overflow-hidden rounded-t-[32px] border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-lg font-bold text-cyan-300 ring-1 ring-cyan-400/20">
                C
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Cognito LMS</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Learn, manage, notify, and track everything from one academic hub.
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
              Cognito LMS helps students, faculty, and administrators stay aligned
              through structured exams, timely notifications, and streamlined academic workflows.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="group flex h-11 w-11 items-center justify-center rounded-full invert brightness-0 border border-white/10 bg-white/5 transition hover:-translate-y-0.5 hover:border-cyan-400/40 hover:bg-cyan-400/10"
                >
                  <img
                    src={item.icon}
                    alt={item.label}
                    className="h-5 w-5 object-contain opacity-90 transition group-hover:opacity-100"
                  />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Quick links
            </h4>

            <div className="mt-5 space-y-3">
              {quickLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  className="group flex items-center gap-3 text-sm text-slate-300 transition hover:text-white"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition group-hover:bg-white/10 group-hover:text-cyan-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </a> 
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Contact
            </h4>

            <div className="mt-5 space-y-3">
              {contactItems.map(({ label, Icon }) => (
                <div
                  key={label}
                  className="group flex items-center gap-3 text-sm text-slate-300 transition hover:text-white cursor-pointer"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition group-hover:bg-white/10 group-hover:text-cyan-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="leading-10">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-slate-500">
          © 2026 Cognito LMS. All rights reserved.
          <br />
          Made with ❤️ by Pratim Sarkar.
        </div>
      </div>
    </footer>
  );
};

export default Footer;