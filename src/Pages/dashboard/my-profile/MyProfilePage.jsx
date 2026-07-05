import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  CalendarDays,
  Download,
  FileText,
  IdCard,
  Loader2,
  LockKeyhole,
  Mail,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@components/components/ui/tabs";
import EmployeeService from "@/services/employee.service";
import {
  DetailTabs,
  OverviewTab,
  ProfileHero,
  SectionCard,
  StatusBadge,
} from "./components/ProfileCards";

const profileQueryKey = ["employee-profile"];
const quickActionsQueryKey = ["employee-profile-quick-actions"];

const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

const getProfilePayload = (profile) => ({
  name: profile?.fullName || "",
  phoneNo: profile?.phoneNo || "",
  emergencyContactNo: profile?.emergencyContactNo || "",
  dateOfBirth: toDateInput(profile?.dateOfBirth),
  gender: profile?.gender || "",
  address: profile?.address || "",
  city: profile?.city || "",
  state: profile?.state || "",
  pincode: profile?.pincode || "",
});

function MyProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [sheetAction, setSheetAction] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [selectedImage, setSelectedImage] = useState(null);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      const response = await EmployeeService.getEmployeeProfile();
      return response.data.profile;
    },
  });

  const quickActionsQuery = useQuery({
    queryKey: quickActionsQueryKey,
    queryFn: async () => {
      const response = await EmployeeService.getEmployeeQuickActions();
      return response.data.quickActions || [];
    },
  });

  const idCardQuery = useQuery({
    queryKey: ["employee-id-card", sheetAction],
    queryFn: async () => {
      const response = await EmployeeService.getEmployeeIdCard();
      return response.data.idCard;
    },
    enabled: sheetAction === "download_id_card",
  });

  const profile = profileQuery.data;
  const quickActions = useMemo(
    () =>
      quickActionsQuery.data?.length
        ? quickActionsQuery.data
        : [
            { key: "update_profile", label: "Update Profile" },
            { key: "change_password", label: "Change Password" },
            { key: "download_id_card", label: "Download ID Card" },
            { key: "view_payslip", label: "View Payslip" },
            { key: "request_leave", label: "Request Leave", enabled: false },
            { key: "raise_request", label: "Raise Request" },
          ],
    [quickActionsQuery.data]
  );

  const updateProfileMutation = useMutation({
    mutationFn: (formData) => EmployeeService.updateEmployeeProfile({ formData }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setSheetAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update profile"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => EmployeeService.changeEmployeePassword(payload),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setSheetAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to change password"),
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      return EmployeeService.uploadEmployeeProfileImage({ formData });
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Profile image updated");
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setSelectedImage(null);
      setSheetAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to upload image"),
  });

  const openAction = (key) => {
    if (key === "update_profile") setProfileForm(getProfilePayload(profile));
    setSheetAction(key);
  };

  const updateField = (name, value) => {
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const isLoading = profileQuery.isLoading || quickActionsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm font-semibold text-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-theme-color" />
          Loading employee profile
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="p-5">
        <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300">
          <div className="flex items-center gap-3 font-semibold">
            <AlertCircle className="h-5 w-5" />
            Unable to load employee profile
          </div>
          <p className="mt-2 text-sm">{profileQuery.error?.response?.data?.message || "Please try again in a moment."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground md:p-6">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <ProfileHero profile={profile} onAction={openAction} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
            {[
              ["overview", "Overview"],
              ["personal", "Personal Information"],
              ["work", "Work Information"],
              ["emergency", "Emergency Contact"],
              ["documents", "Documents"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent bg-transparent px-6 py-4 text-sm font-bold text-muted-foreground shadow-none data-[state=active]:border-orange-500 data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-5">
            <OverviewTab profile={profile} quickActions={quickActions} onAction={openAction} />
          </TabsContent>
          {["personal", "work", "emergency", "documents"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-5">
              <DetailTabs profile={profile} activeTab={tab} />
            </TabsContent>
          ))}
        </Tabs>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-5 text-orange-900 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-100">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-white dark:bg-orange-400 dark:text-slate-950">i</span>
            <div>
              <p className="font-bold">Keep Your Profile Updated</p>
              <p className="mt-1 text-sm text-orange-800/80 dark:text-orange-100/80">
                Please ensure your personal and contact information is always up to date for smooth communication and access.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ProfileActionSheet
        action={sheetAction}
        onOpenChange={(open) => !open && setSheetAction(null)}
        profile={profile}
        profileForm={profileForm}
        updateField={updateField}
        updateProfileMutation={updateProfileMutation}
        passwordForm={passwordForm}
        setPasswordForm={setPasswordForm}
        changePasswordMutation={changePasswordMutation}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        uploadImageMutation={uploadImageMutation}
        idCard={idCardQuery.data}
        idCardLoading={idCardQuery.isFetching}
      />
    </div>
  );
}

function ProfileActionSheet({
  action,
  onOpenChange,
  profile,
  profileForm,
  updateField,
  updateProfileMutation,
  passwordForm,
  setPasswordForm,
  changePasswordMutation,
  selectedImage,
  setSelectedImage,
  uploadImageMutation,
  idCard,
  idCardLoading,
}) {
  const titles = {
    update_profile: ["Update Profile", "Edit your personal and contact details."],
    change_password: ["Change Password", "Update your employee account password."],
    download_id_card: ["Employee ID Card", "Preview your current ID card details."],
    view_payslip: ["View Payslip", "Payslip access opens from the employee payment statement module."],
    request_leave: ["Request Leave", "Leave request workflow is not enabled yet."],
    raise_request: ["Raise Request", "Open the checklist and request support from the team."],
    manage_access: ["Role & Access", "Review modules currently assigned to your employee role."],
    upload_image: ["Upload Profile Image", "Replace your employee profile photo."],
  };
  const [title, description] = titles[action] || ["Quick Action", "Employee profile action"];

  return (
    <Sheet open={Boolean(action)} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {action === "update_profile" && (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                updateProfileMutation.mutate(profileForm);
              }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Full Name" value={profileForm.name} onChange={(value) => updateField("name", value)} />
                <FormField label="Phone Number" value={profileForm.phoneNo} onChange={(value) => updateField("phoneNo", value)} />
                <FormField label="Emergency Contact" value={profileForm.emergencyContactNo} onChange={(value) => updateField("emergencyContactNo", value)} />
                <FormField label="Date of Birth" type="date" value={profileForm.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} />
                <FormField label="Gender" value={profileForm.gender} onChange={(value) => updateField("gender", value)} />
                <FormField label="Pincode" value={profileForm.pincode} onChange={(value) => updateField("pincode", value)} />
                <FormField label="City" value={profileForm.city} onChange={(value) => updateField("city", value)} />
                <FormField label="State" value={profileForm.state} onChange={(value) => updateField("state", value)} />
              </div>
              <FormField label="Address" value={profileForm.address} onChange={(value) => updateField("address", value)} />
              <Button type="submit" className="h-11 w-full gap-2 bg-theme-color" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
              <Button type="button" variant="outline" className="h-11 w-full gap-2" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </form>
          )}

          {action === "change_password" && (
            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                changePasswordMutation.mutate(passwordForm);
              }}
            >
              <FormField
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))}
              />
              <FormField
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))}
              />
              <Button type="submit" className="h-11 w-full gap-2 bg-theme-color" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
                Change Password
              </Button>
            </form>
          )}

          {action === "download_id_card" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-card p-5">
                {idCardLoading ? (
                  <div className="flex items-center gap-3 text-sm font-semibold"><Loader2 className="h-4 w-4 animate-spin" /> Loading ID card</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-muted">
                        {idCard?.profileImage?.small ? <img src={idCard.profileImage.small} alt={idCard.fullName} className="h-full w-full object-cover" /> : <IdCard className="h-8 w-8 text-muted-foreground" />}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{idCard?.fullName || profile?.fullName}</h3>
                        <p className="text-sm font-semibold text-muted-foreground">{idCard?.designation || profile?.designation}</p>
                        <StatusBadge>{idCard?.status || profile?.status}</StatusBadge>
                      </div>
                    </div>
                    <div className="grid gap-3 rounded-lg bg-muted/40 p-4 text-sm">
                      <span><b>Employee ID:</b> {idCard?.employeeId || profile?.employeeId}</span>
                      <span><b>Email:</b> {idCard?.email || profile?.email}</span>
                      <span><b>Phone:</b> {idCard?.phoneNo || profile?.phoneNo}</span>
                      <span><b>Department:</b> {idCard?.department || profile?.department}</span>
                    </div>
                  </div>
                )}
              </div>
              <Button className="h-11 w-full gap-2 bg-theme-color" onClick={() => window.print()}>
                <Download className="h-4 w-4" /> Print ID Card
              </Button>
            </div>
          )}

          {action === "upload_image" && (
            <div className="space-y-5">
              <Input type="file" accept="image/*" onChange={(event) => setSelectedImage(event.target.files?.[0] || null)} />
              <Button className="h-11 w-full gap-2 bg-theme-color" disabled={!selectedImage || uploadImageMutation.isPending} onClick={() => uploadImageMutation.mutate(selectedImage)}>
                {uploadImageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload Image
              </Button>
            </div>
          )}

          {action === "manage_access" && (
            <SectionCard title="Assigned Module Access">
              <div className="grid gap-3">
                {(profile?.moduleAccess || []).map((module) => (
                  <div key={module.key} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                    <span className="font-semibold text-foreground">{module.label}</span>
                    <StatusBadge>{module.allowed ? "Allowed" : "Denied"}</StatusBadge>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {["view_payslip", "request_leave", "raise_request"].includes(action) && (
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                {action === "view_payslip" && <FileText className="h-6 w-6 text-emerald-600" />}
                {action === "request_leave" && <CalendarDays className="h-6 w-6 text-rose-600" />}
                {action === "raise_request" && <Mail className="h-6 w-6 text-fuchsia-600" />}
                <div>
                  <p className="font-bold text-foreground">{title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{description}</p>
                  {action === "request_leave" && (
                    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300">
                      This action is currently disabled by the API.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FormField({ label, value, onChange, type = "text" }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-md" />
    </div>
  );
}

export default MyProfilePage;
