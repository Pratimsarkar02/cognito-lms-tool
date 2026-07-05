import PropTypes from "prop-types";
import { FileText, Link as LinkIcon } from "lucide-react";

const NotificationAttachments = ({ attachments = [], externalLink = "" }) => {
  if (!attachments.length && !externalLink) return null;

  return (
    <div className="mt-4 space-y-3">
      {!!attachments.length && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => (
            <a
              key={file._id}
              href={file.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <FileText className="h-4 w-4" />
              <span className="max-w-[180px] truncate">{file.fileName}</span>
            </a>
          ))}
        </div>
      )}

      {externalLink && (
        <a
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-800"
        >
          <LinkIcon className="h-4 w-4" />
          Open related link
        </a>
      )}
    </div>
  );
};

NotificationAttachments.propTypes = {
  attachments: PropTypes.array,
  externalLink: PropTypes.string,
};

export default NotificationAttachments;