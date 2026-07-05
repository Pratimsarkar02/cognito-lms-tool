import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import {
  CalendarDays,
  Globe,
  ImagePlus,
  Link as LinkIcon,
  Pin,
  Send,
  ShieldCheck,
  X,
  FileText,
  Upload,
} from "lucide-react";
import { notificationService } from "../../../services/notificationService";

const ROLE_OPTIONS = ["Student", "Faculty", "Admin"];
const CATEGORY_OPTIONS = [
  { label: "Announcement", value: "announcement" },
  { label: "Urgent", value: "urgent" },
  { label: "Academic", value: "academic" },
  { label: "Event", value: "event" },
  { label: "General", value: "general" },
];

const getFilePreviewType = (file) => {
  if (!file?.type) return "file";
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return "file";
};

const NotificationComposer = ({ userData, onCreated }) => {
  const fileInputRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "announcement",
    targetRoles: userData?.role === "Admin" ? ["Student", "Faculty"] : ["Student"],
    externalLink: "",
    eventDate: "",
    isPinned: false,
    status: "published",
  });
  const [files, setFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const initials = useMemo(() => {
    const first = userData?.firstName?.[0] || "";
    const last = userData?.lastName?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  }, [userData]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
      });
    };
  }, [previewUrls]);

  const resetComposer = () => {
    previewUrls.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
    });

    setForm({
      title: "",
      description: "",
      category: "announcement",
      targetRoles: userData?.role === "Admin" ? ["Student", "Faculty"] : ["Student"],
      externalLink: "",
      eventDate: "",
      isPinned: false,
      status: "published",
    });
    setFiles([]);
    setPreviewUrls([]);
    setIsExpanded(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRoleToggle = (role) => {
    setForm((prev) => {
      const alreadySelected = prev.targetRoles.includes(role);
      const nextRoles = alreadySelected
        ? prev.targetRoles.filter((item) => item !== role)
        : [...prev.targetRoles, role];

      return {
        ...prev,
        targetRoles: nextRoles,
      };
    });
  };

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;

    const mergedFiles = [...files, ...selectedFiles].slice(0, 5);

    const nextPreviewUrls = mergedFiles.map((file) => ({
      name: file.name,
      type: getFilePreviewType(file),
      url:
        getFilePreviewType(file) === "image" || getFilePreviewType(file) === "video"
          ? URL.createObjectURL(file)
          : "",
    }));

    previewUrls.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
    });

    setFiles(mergedFiles);
    setPreviewUrls(nextPreviewUrls);
    setIsExpanded(true);
  };

  const removeFileAtIndex = (indexToRemove) => {
    const nextFiles = files.filter((_, index) => index !== indexToRemove);

    previewUrls.forEach((item) => {
      if (item.url) URL.revokeObjectURL(item.url);
    });

    const nextPreviewUrls = nextFiles.map((file) => ({
      name: file.name,
      type: getFilePreviewType(file),
      url:
        getFilePreviewType(file) === "image" || getFilePreviewType(file) === "video"
          ? URL.createObjectURL(file)
          : "",
    }));

    setFiles(nextFiles);
    setPreviewUrls(nextPreviewUrls);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description are required");
      return;
    }

    if (!form.targetRoles.length) {
      toast.error("Select at least one target role");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append("title", form.title.trim());
      payload.append("description", form.description.trim());
      payload.append("category", form.category);
      payload.append("targetRoles", JSON.stringify(form.targetRoles));
      payload.append("externalLink", form.externalLink.trim());
      payload.append("eventDate", form.eventDate || "");
      payload.append("isPinned", String(form.isPinned));
      payload.append("status", form.status);

      files.forEach((file) => {
        payload.append("attachments", file);
      });

      const response = await notificationService.createNotification(payload);
      toast.success(response?.message || "Notification posted");
      onCreated?.(response.notification);
      resetComposer();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to publish notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <form onSubmit={handleSubmit} className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-600 to-teal-500 text-sm font-semibold text-white shadow-sm">
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="flex min-h-[52px] w-full items-center cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 text-left text-sm text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50/50"
            >
              Share an announcement, update, exam note, or event...
            </button>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsExpanded(true);
                  fileInputRef.current?.click();
                }}
                className="inline-flex items-center gap-2 rounded-full cursor-pointer border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <ImagePlus size={16} />
                Add media
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="inline-flex items-center gap-2 rounded-full cursor-pointer border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
              >
                <ShieldCheck size={16} />
                Audience
              </button>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Write a strong title"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />

            <textarea
              rows={5}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="What should students or faculty know?"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
            />

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs  font-semibold uppercase tracking-wide text-slate-500">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, category: event.target.value }))
                  }
                  className="w-full rounded-2xl border cursor-pointer border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Publish state
                </label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                  className="w-full rounded-2xl border cursor-pointer border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                >
                  <option value="published">Publish now</option>
                  <option value="archived">Save archived</option>
                </select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <Globe size={15} />
                  External link
                </label>
                <div className="relative">
                  <LinkIcon
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="url"
                    value={form.externalLink}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, externalLink: event.target.value }))
                    }
                    placeholder="https://example.com/resource"
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <label className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <CalendarDays size={15} />
                  Event date
                </label>
                <input
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, eventDate: event.target.value }))
                  }
                  className="w-full rounded-2xl border cursor-pointer border-slate-200 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-100"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <label className="mb-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Target roles
              </label>

              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => {
                  const selected = form.targetRoles.includes(role);

                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleToggle(role)}
                      className={`rounded-full px-4 py-2 text-sm font-medium cursor-pointer transition ${
                        selected
                          ? "bg-cyan-600 text-white shadow-sm"
                          : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                      }`}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Media and files</p>
                  <p className="text-xs text-slate-500">
                    Images and videos will preview; unsupported files stay downloadable.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full cursor-pointer bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <Upload size={16} />
                  Upload files
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              {previewUrls.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {previewUrls.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => removeFileAtIndex(index)}
                        className="absolute right-2 top-2 z-10 rounded-full cursor-pointer bg-black/65 p-1.5 text-white transition hover:bg-black"
                      >
                        <X size={14} />
                      </button>

                      {file.type === "image" && (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="h-44 w-full object-cover"
                        />
                      )}

                      {file.type === "video" && (
                        <video
                          src={file.url}
                          controls
                          className="h-44 w-full bg-black object-cover"
                        />
                      )}

                      {file.type === "file" && (
                        <div className="flex h-44 flex-col items-center justify-center gap-3 px-4 text-center">
                          <FileText size={28} className="text-slate-400" />
                          <p className="line-clamp-2 text-sm font-medium text-slate-700">
                            {file.name}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <label className="inline-flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, isPinned: event.target.checked }))
                  }
                  className="h-4 w-4 rounded cursor-pointer border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="inline-flex items-center cursor-pointer gap-2 font-medium">
                  <Pin size={15} className="text-amber-500" />
                  Pin this notification
                </span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetComposer}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium cursor-pointer text-slate-600 transition hover:bg-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-full cursor-pointer bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Posting..." : "Post notification"}
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

NotificationComposer.propTypes = {
  userData: PropTypes.object,
  onCreated: PropTypes.func,
};

export default NotificationComposer;