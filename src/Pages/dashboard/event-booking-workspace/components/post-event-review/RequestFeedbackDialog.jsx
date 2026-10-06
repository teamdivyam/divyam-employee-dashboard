/* eslint-disable react/prop-types */
import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Mail, Phone, Send } from "lucide-react";

import { Button } from "@components/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { bookingCode } from "../../eventBookingDashboard.utils";

export default function RequestFeedbackDialog({ open, onOpenChange, booking }) {
  const clientName = booking?.customer?.name || booking?.eventName || "Client";
  const clientPhone = booking?.customer?.phone || "";
  const [channel, setChannel] = useState("whatsapp");
  const [template, setTemplate] = useState(
    `Dear ${clientName}, thank you for choosing Divyam! Please take 2 minutes to share your valuable feedback with us: https://feedback.divyam.com/e/${bookingCode(booking) || ""}`
  );

  const handleSend = () => {
    toast.success(`Feedback request sent successfully via ${channel.toUpperCase()}!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 sm:rounded-xl">
        <DialogHeader className="border-b border-border px-6 pt-5 pb-4">
          <DialogTitle className="text-base font-bold">Request Feedback</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Send a feedback request link to the client or family via WhatsApp, Email, or SMS.
          </p>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Select Channel</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "text-emerald-600" },
                { id: "email", label: "Email", icon: Mail, color: "text-blue-600" },
                { id: "sms", label: "SMS", icon: Phone, color: "text-amber-600" },
              ].map((c) => {
                const Icon = c.icon;
                const isSelected = channel === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setChannel(c.id)}
                    className={`flex items-center justify-center gap-2 rounded-md border p-2.5 text-xs font-medium transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${c.color}`} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Recipient</Label>
            <Input
              disabled
              value={clientPhone ? `${clientName} (${clientPhone})` : clientName}
              className="h-9 text-xs bg-muted"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Message Preview</Label>
            <textarea
              rows={4}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full rounded-md border border-input p-3 text-xs focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              onClick={handleSend}
            >
              <Send className="h-3.5 w-3.5" />
              Send Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


