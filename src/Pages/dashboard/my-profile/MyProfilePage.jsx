/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle, Camera, Loader2, LockKeyhole, Save } from "lucide-react";
import { Button } from "@components/components/ui/button";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { Textarea } from "@components/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@components/components/ui/tabs";
import LegacyEmployeeService from "@/services/employee.service";
import EmployeeV2Service from "@/services/employee-v2.service";
import {
  CompletionStrip,
  DocumentsTab,
  EmergencyContactTab,
  OverviewTab,
  PersonalInformationTab,
  ProfileHero,
  WorkInformationTab,
  getSections,
  profileName,
  profileTabs,
} from "./components/ProfileCards";

const profileQueryKey = ["employee-profile"];

const joinAddress = (address = {}) =>
  [address.addressLine1, address.addressLine2].filter(Boolean).join(", ");

const mapEmployeeToProfile = (employee = {}) => {
  const address = employee.address || {};
  const emergencyContact = employee.emergencyContact || {};
  const permissions = employee.permissionOverrides || {};
  const completionFields = [
    employee.name,
    employee.email,
    employee.phoneNumber,
    employee.dateOfBirth,
    employee.gender,
    address.addressLine1,
    address.city,
    emergencyContact.name,
    employee.designation,
    employee.joiningDate,
    employee.workLocation,
  ];
  const completedFields = completionFields.filter(Boolean).length;

  return {
    ...employee,
    profileImage: employee.profileImage
      ? {
          ...employee.profileImage,
          original: employee.profileImage.originalUrl,
          small: employee.profileImage.smallUrl,
          medium: employee.profileImage.mediumUrl,
          large: employee.profileImage.largeUrl,
        }
      : null,
    overview: {
      fullName: employee.name,
      status: employee.employmentStatus,
      designation: employee.designation,
      employeeId: employee.employeeId,
      phoneNo: employee.phoneNumber,
      email: employee.email,
      location: employee.workLocation || joinAddress(address),
      panelAccess: employee.accessRole,
      reportingManagerName: employee.reportingManager?.name,
      joiningDate: employee.joiningDate,
      employmentType: employee.employmentType,
    },
    personalInformation: {
      fullName: employee.name,
      emailAddress: employee.email,
      phoneNo: employee.phoneNumber,
      mobileNumber: employee.phoneNumber,
      dateOfBirth: employee.dateOfBirth,
      gender: employee.gender,
      address: joinAddress(address),
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2,
      city: address.city,
      state: address.state,
      pinCode: address.pincode,
      country: address.country,
    },
    roleAndAccess: {
      roleDesignation: employee.designation || employee.accessRole,
      panelAccess: employee.accessRole,
      moduleAccess: [
        ...(permissions.allow || []).map((key) => ({ key, label: key, allowed: true })),
        ...(permissions.deny || []).map((key) => ({ key, label: key, allowed: false })),
      ],
    },
    employmentInformation: {
      employeeId: employee.employeeId,
      employmentType: employee.employmentType,
      joiningDate: employee.joiningDate,
      probationEndDate: employee.probationEndDate,
      workLocation: employee.workLocation,
    },
    emergencyContactInformation: {
      name: emergencyContact.name,
      relationship: emergencyContact.relationship,
      mobileNumber: emergencyContact.mobileNumber || emergencyContact.phoneNumber,
    },
    loginSecurity: {
      loginEmail: employee.email,
      loginStatus: employee.accountStatus,
      lastLoginAt: employee.lastLoginAt,
      passwordStatus: employee.mustChangePassword ? "Change Required" : "Protected",
    },
    profileCompletion: {
      percentage: Math.round((completedFields / completionFields.length) * 100),
      updatedAt: employee.updatedAt,
    },
    quickActions: [],
    summary: {},
  };
};

const dateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};

const profileFormFromApi = (profile) => {
  const { personal, emergency } = getSections(profile);
  return {
    name: personal.fullName || profileName(profile),
    email: personal.emailAddress || "",
    phoneNo: personal.phoneNo || personal.mobileNumber || "",
    mobileNumber: personal.mobileNumber || personal.phoneNo || "",
    dateOfBirth: dateInput(personal.dateOfBirth),
    gender: personal.gender || "",
    address: personal.addressLine1 || personal.address || "",
    addressLine2: personal.addressLine2 || "",
    city: personal.city || "",
    state: personal.state || "",
    pincode: personal.pinCode || personal.pincode || "",
    country: personal.country || "",
    emergencyContactNo: emergency.mobileNumber || "",
    emergencyContact: {
      name: emergency.name || "",
      relationship: emergency.relationship || "",
      mobileNumber: emergency.mobileNumber || "",
    },
  };
};

const profileFormToApi = (form = {}) => {
  const emergencyContact = form.emergencyContact || {};
  const hasEmergencyContact = Object.values(emergencyContact).some(Boolean);

  return {
    name: form.name?.trim() || "",
    email: form.email?.trim() || "",
    phoneNumber: (form.mobileNumber || form.phoneNo)?.trim() || "",
    dateOfBirth: form.dateOfBirth || null,
    gender: form.gender || null,
    address: {
      addressLine1: form.address?.trim() || "",
      addressLine2: form.addressLine2?.trim() || "",
      city: form.city?.trim() || "",
      state: form.state?.trim() || "",
      pincode: form.pincode?.trim() || "",
      country: form.country?.trim() || "",
    },
    emergencyContact: hasEmergencyContact
      ? {
          name: emergencyContact.name?.trim() || "",
          relationship: emergencyContact.relationship?.trim() || "",
          phoneNumber: emergencyContact.mobileNumber?.trim() || "",
        }
      : null,
  };
};

export default function MyProfilePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [sheetAction, setSheetAction] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileImage, setProfileImage] = useState(null);

  const profileQuery = useQuery({
    queryKey: profileQueryKey,
    queryFn: async () => {
      const meResponse = await EmployeeV2Service.me();
      const currentEmployee = meResponse.data?.data?.employee;
      const employeeId = currentEmployee?.employeeId;

      if (!employeeId) throw new Error("Employee ID was not found for the signed-in user");

      const detailResponse = await EmployeeV2Service.me(employeeId);
      return mapEmployeeToProfile(detailResponse.data?.data?.employee || currentEmployee);
    },
  });

  const profile = profileQuery.data || {};

  const updateProfileMutation = useMutation({
    mutationFn: (formData) => EmployeeV2Service.editEmployee(profile.employeeId, profileFormToApi(formData)),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setSheetAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update profile"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }) => EmployeeV2Service.changePassword({ currentPassword, newPassword }),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Password changed successfully");
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSheetAction(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update password"),
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("profileImage", file);
      return EmployeeV2Service.editEmployee(profile.employeeId, formData);
    },
    onSuccess: (response) => {
      toast.success(response.data?.message || "Profile image updated successfully");
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      setProfileImage(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to update profile image"),
  });

  const downloadIdCardMutation = useMutation({
    // The v2 service does not expose an ID-card endpoint yet, so this unrelated
    // download action continues to use its existing endpoint.
    mutationFn: () => LegacyEmployeeService.getEmployeeIdCard(),
    onSuccess: (response) => {
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${profile.employeeId || "employee"}-id-card`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
    onError: (error) => toast.error(error.response?.data?.message || "Unable to download ID card"),
  });

  const openAction = (action) => {
    if (action === "tab:personal") {
      setActiveTab("personal");
      return;
    }
    if (action === "tab:work") {
      setActiveTab("work");
      return;
    }
    if (action === "download_id_card") {
      downloadIdCardMutation.mutate();
      return;
    }
    if (["request_leave", "raise_request", "view_payslip"].includes(action)) {
      toast.info("Backend endpoint is needed for this quick action.");
      return;
    }
    if (action === "edit") setProfileForm(profileFormFromApi(profile));
    setSheetAction(action);
  };

  const updateField = (name, value) => {
    setProfileForm((current) => ({ ...current, [name]: value }));
  };

  const updateEmergencyField = (name, value) => {
    setProfileForm((current) => {
      const emergencyContact = { ...(current.emergencyContact || {}), [name]: value };
      return {
        ...current,
        emergencyContact,
        emergencyContactNo: name === "mobileNumber" ? value : current.emergencyContactNo,
      };
    });
  };

  const currentTitle = useMemo(() => {
    if (sheetAction === "edit") return ["Edit Profile", "Update personal details, address, emergency contact, and profile image."];
    if (sheetAction === "password") return ["Change Password", "Update your employee dashboard password."];
    return ["Profile Action", "Manage employee profile details."];
  }, [sheetAction]);

  const submitPassword = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error("Current password and new password are required");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const submitProfile = () => {
    updateProfileMutation.mutate(profileForm);
    if (profileImage) uploadImageMutation.mutate(profileImage);
  };

  if (profileQuery.isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-5 py-4 text-sm font-semibold text-card-foreground shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading employee profile
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="bg-background p-5">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
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
    <div className="min-h-[calc(100vh-4rem)] bg-background p-4 text-foreground">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <ProfileHero profile={profile} onAction={openAction} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
            {profileTabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent bg-transparent px-6 py-4 text-xs font-bold text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <OverviewTab profile={profile} onAction={openAction} />
            <CompletionStrip profile={profile} />
          </TabsContent>
          <TabsContent value="personal" className="mt-4">
            <PersonalInformationTab profile={profile} />
          </TabsContent>
          <TabsContent value="work" className="mt-4">
            <WorkInformationTab profile={profile} />
          </TabsContent>
          <TabsContent value="emergency" className="mt-4">
            <EmergencyContactTab profile={profile} />
          </TabsContent>
          <TabsContent value="documents" className="mt-4">
            <DocumentsTab profile={profile} onAction={openAction} />
          </TabsContent>
        </Tabs>
      </div>

      <Sheet open={Boolean(sheetAction)} onOpenChange={(open) => !open && setSheetAction(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{currentTitle[0]}</SheetTitle>
            <SheetDescription>{currentTitle[1]}</SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {sheetAction === "edit" && (
              <ProfileEditForm
                form={profileForm}
                updateField={updateField}
                updateEmergencyField={updateEmergencyField}
                profileImage={profileImage}
                setProfileImage={setProfileImage}
                onCancel={() => setSheetAction(null)}
                onSubmit={submitProfile}
                isPending={updateProfileMutation.isPending || uploadImageMutation.isPending}
              />
            )}
            {sheetAction === "password" && (
              <PasswordForm
                form={passwordForm}
                setForm={setPasswordForm}
                onSubmit={submitPassword}
                isPending={changePasswordMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProfileEditForm({ form, updateField, updateEmergencyField, profileImage, setProfileImage, onSubmit, onCancel, isPending }) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="rounded-lg border border-border p-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Camera className="h-4 w-4" /> Profile Image
        </div>
        <Input className="mt-3 h-10 text-xs crm-input" type="file" accept="image/*" onChange={(event) => setProfileImage(event.target.files?.[0] || null)} />
        {profileImage && <p className="mt-2 text-xs text-muted-foreground">{profileImage.name}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Full Name" value={form.name} onChange={(value) => updateField("name", value)} />
        <FormField label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
        <FormField label="Phone No" value={form.phoneNo} onChange={(value) => updateField("phoneNo", value)} />
        <FormField label="Mobile Number" value={form.mobileNumber} onChange={(value) => updateField("mobileNumber", value)} />
        <FormField label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(value) => updateField("dateOfBirth", value)} />
        <FormField label="Gender" value={form.gender} onChange={(value) => updateField("gender", value)} />
        <FormField label="City" value={form.city} onChange={(value) => updateField("city", value)} />
        <FormField label="State" value={form.state} onChange={(value) => updateField("state", value)} />
        <FormField label="PIN Code" value={form.pincode} onChange={(value) => updateField("pincode", value)} />
      </div>

      <TextAreaField label="Address" value={form.address} onChange={(value) => updateField("address", value)} />

      <div className="rounded-lg border border-border p-3">
        <p className="mb-3 text-sm font-semibold text-foreground">Emergency Contact</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField label="Name" value={form.emergencyContact?.name} onChange={(value) => updateEmergencyField("name", value)} />
          <FormField label="Relationship" value={form.emergencyContact?.relationship} onChange={(value) => updateEmergencyField("relationship", value)} />
          <FormField label="Mobile Number" value={form.emergencyContact?.mobileNumber} onChange={(value) => updateEmergencyField("mobileNumber", value)} />
        </div>
      </div>

      <Button type="submit" className="h-10 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Changes
      </Button>
      <Button type="button" variant="outline" className="h-10 w-full" onClick={onCancel}>Cancel</Button>
    </form>
  );
}

function PasswordForm({ form, setForm, onSubmit, isPending }) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <FormField label="Current Password" type="password" value={form.currentPassword} onChange={(value) => setForm((current) => ({ ...current, currentPassword: value }))} />
      <FormField label="New Password" type="password" value={form.newPassword} onChange={(value) => setForm((current) => ({ ...current, newPassword: value }))} />
      <FormField label="Confirm Password" type="password" value={form.confirmPassword} onChange={(value) => setForm((current) => ({ ...current, confirmPassword: value }))} />
      <Button type="submit" className="h-10 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
        Change Password
      </Button>
    </form>
  );
}

function FormField({ label, value, onChange, type = "text" }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">{label}</Label>
      <Input id={id} type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-md text-xs crm-input" />
    </div>
  );
}

function TextAreaField({ label, value, onChange }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground">{label}</Label>
      <Textarea id={id} value={value || ""} onChange={(event) => onChange(event.target.value)} className="min-h-20 rounded-md text-xs crm-input" />
    </div>
  );
}
