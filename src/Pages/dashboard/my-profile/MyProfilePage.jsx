/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertCircle,
  Camera,
  CloudUpload,
  Download,
  Eye,
  EyeOff,
  FileText,
  Info,
  Loader2,
  LockKeyhole,
  PackageCheck,
  Save,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@components/components/ui/alert";
import { Badge } from "@components/components/ui/badge";
import { Button } from "@components/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/components/ui/dialog";
import { Input } from "@components/components/ui/input";
import { Label } from "@components/components/ui/label";
import { Textarea } from "@components/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@components/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/components/ui/table";
import TabComp, { TabsContent } from "@components/components/tab-comp";
import LegacyEmployeeService from "@/services/employee.service";
import EmployeeV2Service from "@/services/employee-v2.service";
import { CURRENT_EMPLOYEE_QUERY_KEY } from "@/hooks/useCurrentEmployee";
import {
  CompletionStrip,
  DocumentsTab,
  // EmergencyContactTab,
  OverviewTab,
  PersonalInformationTab,
  ProfileHero,
  WorkInformationTab,
  getSections,
  profileName,
  profileTabs,
} from "./components/ProfileCards";

const profileQueryKey = ["employee-profile"];
const profileDocumentsQueryKey = ["employee-profile-documents"];
const employeePaymentProfileQueryKey = ["employee-payment-profile"];
const profileGenderOptions = ["Male", "Female", "Other", "Prefer Not To Say"];
const profileStateOptions = ["Uttar Pradesh", "Madhya Pradesh", "Bihar", "Rajasthan"];
const paymentModeOptions = ["Bank Transfer", "UPI"];
const employeeDocumentTypes = [
  "ID Proof",
  "Address Proof",
  "Offer Letter",
  "Employment Contract",
  "Resume",
  "Certificate",
  "Legal",
  "Bank Document",
  "Tax Document",
  "Other",
];
const employeeDocumentFileTypes = ["application/pdf", "image/png", "image/jpeg"];
const maxEmployeeDocumentSize = 10 * 1024 * 1024;
const profileImageTypes = ["image/png", "image/jpg", "image/jpeg", "image/heif", "image/heic"];
const phoneNumberPattern = /^[6-9]\d{9}$/;
const pincodePattern = /^[1-9]\d{5}$/;
const accountNumberPattern = /^\d{8,18}$/;
const ifscCodePattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const upiIdPattern = /^[\w.-]{2,256}@[A-Za-z]{2,64}$/;
const maxProfileImageSize = 5 * 1024 * 1024;
const assignedAssetRows = [
  {
    asset: "Apple MacBook Air M2",
    assetId: "AST-LAP-00045",
    assignedOn: "16 May 2026",
    returnedOn: "--",
    condition: "Good",
    status: "Assigned",
  },
  {
    asset: "iPhone 14 Pro",
    assetId: "AST-MOB-00122",
    assignedOn: "20 May 2026",
    returnedOn: "--",
    condition: "Good",
    status: "Return Pending",
  },
  {
    asset: "RFID Access Card",
    assetId: "AST-ACC-00311",
    assignedOn: "10 May 2026",
    returnedOn: "--",
    condition: "Good",
    status: "Assigned",
  },
  {
    asset: "Dell 24 Monitor",
    assetId: "AST-MON-00078",
    assignedOn: "10 Feb 2026",
    returnedOn: "15 Mar 2026",
    condition: "Good",
    status: "Returned",
  },
  {
    asset: "Logitech Wireless Headset",
    assetId: "AST-AUD-00056",
    assignedOn: "05 Jan 2026",
    returnedOn: "28 Feb 2026",
    condition: "Good",
    status: "Returned",
  },
];
const myProfileTabs = [
  ...profileTabs,
  { value: "assigned-assets", label: "Assigned Assets", icon: PackageCheck },
];
const myProfileTabValues = new Set(myProfileTabs.map(({ value }) => value));
const emptyPasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};
const emptyDocumentForm = {
  documentType: "",
  documentName: "",
  documentNumber: "",
  issuedAt: "",
  notes: "",
  file: null,
};

const validatePasswordForm = (form) => {
  const errors = {};

  if (!form.currentPassword) {
    errors.currentPassword = "Current password is required.";
  } else if (form.currentPassword.length < 8 || form.currentPassword.length > 128) {
    errors.currentPassword = "Current password must be between 8 and 128 characters.";
  }

  if (!form.newPassword) {
    errors.newPassword = "New password is required.";
  } else if (form.newPassword.length < 8 || form.newPassword.length > 128) {
    errors.newPassword = "New password must be between 8 and 128 characters.";
  } else if (form.newPassword === form.currentPassword) {
    errors.newPassword = "New password must be different from current password.";
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = "Please confirm your new password.";
  } else if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = "Confirm password must match the new password.";
  }

  return errors;
};

const getPasswordErrorMessage = (error) => {
  const rawMessage =
    error.response?.data?.message
    || error.response?.data?.msg
    || error.message
    || "Unable to change password.";

  return String(rawMessage).split("|")[0];
};

const getProfileErrorMessage = (error) => {
  const rawMessage =
    error.response?.data?.message
    || error.response?.data?.msg
    || error.message
    || "Unable to update profile.";

  return String(rawMessage).split("|")[0];
};

const joinAddress = (address = {}) =>
  [address.addressLine1, address.addressLine2].filter(Boolean).join(", ");

const mapEmployeeToProfile = (employee = {}) => {
  const address = employee.address || {};
  const personalDetails = employee.personalInformation || employee.personalDetails || {};
  const emergencyContact =
    employee.emergencyContactInformation
    || employee.emergencyContact
    || {};
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
      alternatePhone:
        personalDetails.alternatePhone
        || employee.alternatePhone
        || employee.alternatePhoneNumber,
      maritalStatus: personalDetails.maritalStatus || employee.maritalStatus,
      aadhaarId:
        personalDetails.aadhaarId
        || personalDetails.aadhaarNumber
        || personalDetails.aadharNumber
        || employee.aadhaarId
        || employee.aadhaarNumber
        || employee.aadharNumber
        || employee.governmentId,
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
      alternateMobileNumber:
        emergencyContact.alternateMobileNumber
        || emergencyContact.alternatePhoneNumber
        || emergencyContact.alternatePhone,
      address:
        emergencyContact.address
        || emergencyContact.contactAddress
        || joinAddress(emergencyContact),
    },
    loginSecurity: {
      loginStatus: employee.accountStatus,
      lastLoginAt: employee.lastLoginAt,
      loginEmail: employee.email,
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

const mapPaymentProfile = (paymentProfile) => {
  if (!paymentProfile) return null;
  const bankAccount = paymentProfile.bankAccount || {};
  const upiDetails = paymentProfile.upiDetails || {};

  return {
    id: paymentProfile._id,
    preferredPaymentMode: paymentProfile.preferredPaymentMode,
    accountHolderName: bankAccount.accountHolderName,
    bankName: bankAccount.bankName,
    accountNumber: bankAccount.accountNumberMasked || bankAccount.accountNumber,
    ifscCode: bankAccount.ifscCode,
    branch: bankAccount.branchName,
    upiId: upiDetails.upiId || upiDetails.upiID || upiDetails.vpa,
    verificationStatus: paymentProfile.verificationStatus,
    verificationRemarks: paymentProfile.verificationRemarks,
    verifiedAt: paymentProfile.verifiedAt,
  };
};

const canEditPaymentProfile = (paymentProfile) => {
  if (!paymentProfile) return true;
  const status = String(paymentProfile.verificationStatus || "").trim().toLowerCase();
  return ["pending verification", "pending", "rejected"].includes(status);
};

const bankFormFromPaymentProfile = (paymentProfile) => {
  const bankAccount = paymentProfile?.bankAccount || {};
  const upiDetails = paymentProfile?.upiDetails || {};
  return {
    preferredPaymentMode: paymentProfile?.preferredPaymentMode || "Bank Transfer",
    accountHolderName: bankAccount.accountHolderName || "",
    bankName: bankAccount.bankName || "",
    accountNumber: "",
    ifscCode: bankAccount.ifscCode || "",
    branchName: bankAccount.branchName || "",
    upiId: upiDetails.upiId || upiDetails.upiID || upiDetails.vpa || "",
  };
};

const validateBankForm = (form, hasExistingAccount) => {
  const errors = {};

  if (!form.accountHolderName?.trim()) errors.accountHolderName = "Account holder name is required.";
  if (!form.bankName?.trim()) errors.bankName = "Bank name is required.";
  if (!hasExistingAccount && !form.accountNumber?.trim()) {
    errors.accountNumber = "Account number is required.";
  } else if (form.accountNumber && !accountNumberPattern.test(form.accountNumber)) {
    errors.accountNumber = "Enter an 8–18 digit account number.";
  }
  if (!ifscCodePattern.test(form.ifscCode?.trim().toUpperCase() || "")) {
    errors.ifscCode = "Enter a valid IFSC code.";
  }
  if (!form.branchName?.trim()) errors.branchName = "Branch name is required.";
  if (form.preferredPaymentMode === "UPI" && !upiIdPattern.test(form.upiId?.trim() || "")) {
    errors.upiId = "Enter a valid UPI ID.";
  } else if (form.upiId && !upiIdPattern.test(form.upiId.trim())) {
    errors.upiId = "Enter a valid UPI ID.";
  }

  return errors;
};

const bankFormToApi = (form) => {
  const bankAccount = {
    accountHolderName: form.accountHolderName.trim(),
    bankName: form.bankName.trim(),
    ifscCode: form.ifscCode.trim().toUpperCase(),
    branchName: form.branchName.trim(),
  };
  if (form.accountNumber) bankAccount.accountNumber = form.accountNumber;

  return {
    preferredPaymentMode: form.preferredPaymentMode,
    bankAccount,
    upiDetails: form.upiId?.trim() ? { upiId: form.upiId.trim() } : null,
  };
};

const dateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};

const documentFormFromApi = (document) => ({
  ...emptyDocumentForm,
  documentType: document?.documentType || "",
  documentName: document?.documentName || "",
  documentNumber: document?.documentNumber || "",
  issuedAt: dateInput(document?.issuedAt),
  notes: document?.notes || "",
});

const validateDocumentForm = (form) => {
  const errors = {};

  if (!form.documentType) errors.documentType = "Document type is required.";
  else if (!employeeDocumentTypes.includes(form.documentType)) errors.documentType = "Select a supported document type.";

  if (!form.documentName?.trim()) errors.documentName = "Document name is required.";
  else if (form.documentName.trim().length > 200) errors.documentName = "Document name cannot exceed 200 characters.";

  if (form.documentNumber?.trim().length > 200) errors.documentNumber = "Document number cannot exceed 200 characters.";
  if (form.notes?.trim().length > 1000) errors.notes = "Notes cannot exceed 1000 characters.";

  if (!form.file) {
    errors.file = "Select a document to upload.";
  } else if (form.file.size > maxEmployeeDocumentSize) {
    errors.file = "Document must be 10 MB or smaller.";
  } else if (!employeeDocumentFileTypes.includes(form.file.type)) {
    errors.file = "Use a PDF, JPG, JPEG, or PNG file.";
  }

  return errors;
};

const buildDocumentFormData = (form) => {
  const formData = new FormData();
  formData.append("documentName", form.documentName.trim());
  formData.append("documentType", form.documentType);
  if (form.documentNumber?.trim()) formData.append("documentNumber", form.documentNumber.trim());
  if (form.issuedAt) formData.append("issuedAt", form.issuedAt);
  if (form.notes?.trim()) formData.append("notes", form.notes.trim());
  formData.append("file", form.file);
  return formData;
};

const profileFormFromApi = (profile) => {
  const { personal, emergency } = getSections(profile);
  return {
    name: personal.fullName || profileName(profile),
    phoneNumber: personal.mobileNumber || personal.phoneNo || "",
    dateOfBirth: dateInput(personal.dateOfBirth),
    gender: personal.gender || "",
    addressLine1: personal.addressLine1 || personal.address || "",
    addressLine2: personal.addressLine2 || "",
    city: personal.city || "",
    state: personal.state || "",
    pincode: personal.pinCode || personal.pincode || "",
    country: personal.country || "",
    emergencyContact: {
      name: emergency.name || "",
      relationship: emergency.relationship || "",
      phoneNumber: emergency.mobileNumber || "",
    },
  };
};

const profileFormToApi = (form = {}) => {
  const emergencyContact = form.emergencyContact || {};
  const hasEmergencyContact = Object.values(emergencyContact).some(Boolean);
  const hasAddress = [
    form.addressLine1,
    form.addressLine2,
    form.city,
    form.state,
    form.pincode,
    form.country,
  ].some(Boolean);

  return {
    name: form.name?.trim() || "",
    phoneNumber: form.phoneNumber?.trim() || "",
    dateOfBirth: form.dateOfBirth || null,
    gender: form.gender || null,
    address: hasAddress
      ? {
          addressLine1: form.addressLine1?.trim() || "",
          addressLine2: form.addressLine2?.trim() || "",
          city: form.city?.trim() || "",
          state: form.state || "",
          pincode: form.pincode?.trim() || "",
          country: form.country?.trim() || "India",
        }
      : null,
    emergencyContact: hasEmergencyContact
      ? {
          name: emergencyContact.name?.trim() || "",
          relationship: emergencyContact.relationship?.trim() || "",
          phoneNumber: emergencyContact.phoneNumber?.trim() || "",
        }
      : null,
  };
};

const buildMyProfileRequest = (form, profileImage) => {
  const payload = profileFormToApi(form);
  if (!profileImage) return payload;

  const formData = new FormData();
  formData.append("profileImage", profileImage);
  formData.append("name", payload.name);
  formData.append("phoneNumber", payload.phoneNumber);
  if (payload.dateOfBirth) formData.append("dateOfBirth", payload.dateOfBirth);
  if (payload.gender) formData.append("gender", payload.gender);
  formData.append("address", JSON.stringify(payload.address));
  formData.append("emergencyContact", JSON.stringify(payload.emergencyContact));
  return formData;
};

const validateProfileForm = (form, profileImage) => {
  const errors = {};
  const emergencyContact = form.emergencyContact || {};
  const hasEmergencyContact = Object.values(emergencyContact).some(Boolean);
  const hasAddress = [
    form.addressLine1,
    form.addressLine2,
    form.city,
    form.state,
    form.pincode,
    form.country,
  ].some(Boolean);

  if (!form.name?.trim()) errors.name = "Full name is required.";
  else if (form.name.trim().length > 200) errors.name = "Full name cannot exceed 200 characters.";

  if (!phoneNumberPattern.test(form.phoneNumber?.trim() || "")) {
    errors.phoneNumber = "Enter a valid 10-digit mobile number starting with 6–9.";
  }

  if (form.dateOfBirth && new Date(form.dateOfBirth) > new Date()) {
    errors.dateOfBirth = "Date of birth cannot be in the future.";
  }
  if (form.gender && !profileGenderOptions.includes(form.gender)) {
    errors.gender = "Select a valid gender.";
  }

  if (hasAddress) {
    if (!form.addressLine1?.trim()) errors.addressLine1 = "Address line 1 is required.";
    else if (form.addressLine1.trim().length > 300) errors.addressLine1 = "Address line 1 cannot exceed 300 characters.";
    if (form.addressLine2?.trim().length > 300) errors.addressLine2 = "Address line 2 cannot exceed 300 characters.";
    if (!form.city?.trim()) errors.city = "City is required.";
    else if (form.city.trim().length > 100) errors.city = "City cannot exceed 100 characters.";
    if (!profileStateOptions.includes(form.state)) errors.state = "Select a valid state.";
    if (!pincodePattern.test(form.pincode?.trim() || "")) errors.pincode = "Enter a valid 6-digit pincode.";
    if (form.country?.trim().length > 100) errors.country = "Country cannot exceed 100 characters.";
  }

  if (hasEmergencyContact) {
    if (!emergencyContact.name?.trim()) errors.emergencyName = "Contact name is required.";
    else if (emergencyContact.name.trim().length > 150) errors.emergencyName = "Contact name cannot exceed 150 characters.";
    if (!phoneNumberPattern.test(emergencyContact.phoneNumber?.trim() || "")) {
      errors.emergencyPhoneNumber = "Enter a valid 10-digit mobile number starting with 6–9.";
    }
    if (!emergencyContact.relationship?.trim()) errors.emergencyRelationship = "Relationship is required.";
    else if (emergencyContact.relationship.trim().length > 100) errors.emergencyRelationship = "Relationship cannot exceed 100 characters.";
  }

  if (profileImage) {
    if (profileImage.size > maxProfileImageSize) {
      errors.profileImage = "Profile image must be 5 MB or smaller.";
    } else if (!profileImageTypes.includes(profileImage.type)) {
      errors.profileImage = "Use a PNG, JPG, JPEG, HEIF, or HEIC image.";
    }
  }

  return errors;
};

function AssignedAssetsTab() {
  const statusClassName = (status) => {
    if (status === "Assigned") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300";
    }
    if (status === "Return Pending") {
      return "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-300";
    }
    return "border-border bg-muted text-muted-foreground";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b border-border px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
          <div>
            <CardTitle className="text-sm font-semibold">Assigned Assets</CardTitle>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              View company assets assigned to you. This page is view-only.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 shrink-0 gap-2 px-3 text-[10px] font-medium">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          Download Asset Statement
        </Button>
      </CardHeader>

      <CardContent className="p-4">
        <div className="overflow-x-auto rounded-md border border-border">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-muted/45">
              <TableRow className="hover:bg-transparent">
                {["Asset", "Asset ID", "Assigned On", "Returned On", "Condition", "Status", "Action"].map((heading) => (
                  <TableHead key={heading} className="h-9 whitespace-nowrap px-3 text-[10px] font-medium">
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedAssetRows.map((asset) => (
                <TableRow key={asset.assetId} className="hover:bg-muted/25">
                  <TableCell className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="grid h-9 w-11 shrink-0 place-items-center rounded border border-border bg-muted/70 text-muted-foreground"
                        aria-label={`${asset.asset} image placeholder`}
                      >
                        <PackageCheck className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="whitespace-nowrap text-[11px] font-medium text-foreground">{asset.asset}</span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-2 text-[10px] font-medium text-foreground">
                    {asset.assetId}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-2 text-[10px] text-foreground">
                    {asset.assignedOn}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-2 text-[10px] text-muted-foreground">
                    {asset.returnedOn}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className="border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-300"
                    >
                      {asset.condition}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <Badge
                      variant="outline"
                      className={`px-2 py-0.5 text-[9px] font-medium ${statusClassName(asset.status)}`}
                    >
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-[10px] font-medium text-primary hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      View
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-[10px] text-blue-700 dark:border-blue-400/25 dark:bg-blue-400/10 dark:text-blue-300">
          <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          All company assets are assigned and managed by the Admin/Inventory team. This page is view-only.
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyProfilePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab = myProfileTabValues.has(requestedTab) ? requestedTab : "overview";
  const setActiveTab = (tab) => {
    if (!myProfileTabValues.has(tab)) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    if (tab === "overview") nextSearchParams.delete("tab");
    else nextSearchParams.set("tab", tab);
    setSearchParams(nextSearchParams, { replace: true });
  };
  const [sheetAction, setSheetAction] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [profileErrors, setProfileErrors] = useState({});
  const [profileFormError, setProfileFormError] = useState("");
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordFormError, setPasswordFormError] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [bankForm, setBankForm] = useState(() => bankFormFromPaymentProfile(null));
  const [bankErrors, setBankErrors] = useState({});
  const [bankFormError, setBankFormError] = useState("");
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [documentUploadMode, setDocumentUploadMode] = useState("upload");
  const [replacementDocumentId, setReplacementDocumentId] = useState(null);
  const [documentForm, setDocumentForm] = useState(emptyDocumentForm);
  const [documentErrors, setDocumentErrors] = useState({});
  const [documentFormError, setDocumentFormError] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState(null);

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

  const documentsQuery = useQuery({
    queryKey: profileDocumentsQueryKey,
    queryFn: async () => {
      const response = await EmployeeV2Service.getMyDocuments();
      return response.data?.data?.documents || [];
    },
    enabled: activeTab === "documents",
  });

  const paymentProfileQuery = useQuery({
    queryKey: [...employeePaymentProfileQueryKey, profile.employeeId],
    queryFn: async () => {
      try {
        const response = await EmployeeV2Service.getEmployeePaymentProfile();
        return response.data?.data?.paymentProfile || null;
      } catch (error) {
        if (error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: activeTab === "personal" && Boolean(profile.employeeId),
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ form, image }) => EmployeeV2Service.updateMyProfile(buildMyProfileRequest(form, image)),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Profile updated successfully");
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
      queryClient.invalidateQueries({ queryKey: CURRENT_EMPLOYEE_QUERY_KEY });
      setProfileImage(null);
      setProfileErrors({});
      setProfileFormError("");
      setSheetAction(null);
    },
    onError: (error) => setProfileFormError(getProfileErrorMessage(error)),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload) => EmployeeV2Service.changePassword(payload),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Password changed successfully");
      setPasswordForm(emptyPasswordForm);
      setPasswordErrors({});
      setPasswordFormError("");
      setSheetAction(null);
      localStorage.removeItem("AppID");
      queryClient.clear();
      window.location.replace("/login");
    },
    onError: (error) => setPasswordFormError(getPasswordErrorMessage(error)),
  });

  const savePaymentProfileMutation = useMutation({
    mutationFn: (form) =>
      EmployeeV2Service.saveEmployeePaymentProfile(bankFormToApi(form)),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Banking details saved successfully");
      queryClient.invalidateQueries({
        queryKey: [...employeePaymentProfileQueryKey, profile.employeeId],
      });
      setBankErrors({});
      setBankFormError("");
      setSheetAction(null);
    },
    onError: (error) => setBankFormError(getProfileErrorMessage(error)),
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ form, replaceDocumentId }) => {
      const uploadResponse = await EmployeeV2Service.uploadMyDocument(buildDocumentFormData(form));
      let replacementCleanupError = null;

      if (replaceDocumentId) {
        try {
          await EmployeeV2Service.deleteMyDocument(replaceDocumentId);
        } catch (error) {
          replacementCleanupError = error;
        }
      }

      return { uploadResponse, replacementCleanupError };
    },
    onSuccess: ({ uploadResponse, replacementCleanupError }) => {
      toast.success(uploadResponse.data?.message || "Document uploaded successfully");
      if (replacementCleanupError) {
        toast.warning("Replacement uploaded, but the old rejected document could not be removed.");
      }
      queryClient.invalidateQueries({ queryKey: profileDocumentsQueryKey });
      setIsDocumentUploadOpen(false);
      setReplacementDocumentId(null);
      setDocumentForm(emptyDocumentForm);
      setDocumentErrors({});
      setDocumentFormError("");
    },
    onError: (error) => setDocumentFormError(getProfileErrorMessage(error)),
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (documentId) => EmployeeV2Service.deleteMyDocument(documentId),
    onSuccess: (response) => {
      toast.success(response.data?.message || "Document deleted successfully");
      queryClient.invalidateQueries({ queryKey: profileDocumentsQueryKey });
      setDocumentToDelete(null);
    },
    onError: (error) => {
      toast.error(getProfileErrorMessage(error));
      setDocumentToDelete(null);
    },
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
    if (action === "edit") {
      setProfileForm(profileFormFromApi(profile));
      setProfileImage(null);
      setProfileErrors({});
      setProfileFormError("");
    }
    if (action === "password") {
      setPasswordForm(emptyPasswordForm);
      setPasswordErrors({});
      setPasswordFormError("");
    }
    setSheetAction(action);
  };

  const openBankEditor = () => {
    if (!canEditPaymentProfile(paymentProfileQuery.data)) return;
    setBankForm(bankFormFromPaymentProfile(paymentProfileQuery.data));
    setBankErrors({});
    setBankFormError("");
    setSheetAction("bank");
  };

  const openDocumentUpload = (document = null) => {
    setDocumentUploadMode(document ? "reupload" : "upload");
    setReplacementDocumentId(document?._id || null);
    setDocumentForm(documentFormFromApi(document));
    setDocumentErrors({});
    setDocumentFormError("");
    setIsDocumentUploadOpen(true);
  };

  const updateDocumentField = (name, value) => {
    setDocumentForm((current) => ({ ...current, [name]: value }));
    setDocumentErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
    setDocumentFormError("");
  };

  const submitDocument = () => {
    const errors = validateDocumentForm(documentForm);
    setDocumentErrors(errors);
    setDocumentFormError("");
    if (Object.keys(errors).length) return;

    uploadDocumentMutation.mutate({
      form: documentForm,
      replaceDocumentId: replacementDocumentId,
    });
  };

  const updateBankField = (name, value) => {
    setBankForm((current) => ({ ...current, [name]: value }));
    setBankErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
    setBankFormError("");
  };

  const submitBankProfile = () => {
    const hasExistingAccount = Boolean(
      paymentProfileQuery.data?.bankAccount?.accountNumberMasked
      || paymentProfileQuery.data?.bankAccount?.accountNumber,
    );
    const errors = validateBankForm(bankForm, hasExistingAccount);
    setBankErrors(errors);
    setBankFormError("");
    if (Object.keys(errors).length) return;

    savePaymentProfileMutation.mutate(bankForm);
  };

  const updateField = (name, value) => {
    setProfileForm((current) => ({ ...current, [name]: value }));
    setProfileErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[name];
      return nextErrors;
    });
    setProfileFormError("");
  };

  const updateEmergencyField = (name, value) => {
    setProfileForm((current) => {
      const emergencyContact = { ...(current.emergencyContact || {}), [name]: value };
      return { ...current, emergencyContact };
    });
    const errorKey = {
      name: "emergencyName",
      phoneNumber: "emergencyPhoneNumber",
      relationship: "emergencyRelationship",
    }[name];
    setProfileErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[errorKey];
      return nextErrors;
    });
    setProfileFormError("");
  };

  const updateProfileImage = (file) => {
    setProfileImage(file);
    setProfileErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors.profileImage;
      return nextErrors;
    });
    setProfileFormError("");
  };

  const currentTitle = useMemo(() => {
    if (sheetAction === "edit") return ["Edit Profile", "Update personal details, address, emergency contact, and profile image."];
    if (sheetAction === "password") return ["Change Password", "Update your employee dashboard password."];
    if (sheetAction === "bank") return ["Edit Banking Details", "Update the payment information sent to the Finance team for verification."];
    return ["Profile Action", "Manage employee profile details."];
  }, [sheetAction]);

  const submitPassword = () => {
    const errors = validatePasswordForm(passwordForm);
    setPasswordErrors(errors);
    setPasswordFormError("");
    if (Object.keys(errors).length) return;

    changePasswordMutation.mutate(passwordForm);
  };

  const updatePasswordField = (name, value) => {
    setPasswordForm((current) => ({ ...current, [name]: value }));
    setPasswordErrors((current) => {
      const nextErrors = { ...current };
      delete nextErrors[name];
      if (name === "newPassword") delete nextErrors.confirmPassword;
      return nextErrors;
    });
    setPasswordFormError("");
  };

  const submitProfile = () => {
    const errors = validateProfileForm(profileForm, profileImage);
    setProfileErrors(errors);
    setProfileFormError("");
    if (Object.keys(errors).length) return;

    updateProfileMutation.mutate({ form: profileForm, image: profileImage });
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

        <TabComp
          tabs={myProfileTabs}
          value={activeTab}
          onValueChange={setActiveTab}
          ariaLabel="Profile sections"
        >

          <TabsContent value="overview" className="mt-4 space-y-4">
            <OverviewTab profile={profile} onAction={openAction} />
            <CompletionStrip profile={profile} />
          </TabsContent>
          <TabsContent value="personal" className="mt-4">
            <PersonalInformationTab
              profile={profile}
              banking={mapPaymentProfile(paymentProfileQuery.data)}
              isBankingLoading={paymentProfileQuery.isLoading}
              bankingError={paymentProfileQuery.error}
              canEditBanking={canEditPaymentProfile(paymentProfileQuery.data)}
              onEditBanking={openBankEditor}
              onRetryBanking={() => paymentProfileQuery.refetch()}
            />
          </TabsContent>
          <TabsContent value="work" className="mt-4">
            <WorkInformationTab profile={profile} />
          </TabsContent>
          {/* <TabsContent value="emergency" className="mt-4">
            <EmergencyContactTab profile={profile} />
          </TabsContent> */}
          <TabsContent value="documents" className="mt-4">
            <DocumentsTab
              documents={documentsQuery.data || []}
              isLoading={documentsQuery.isLoading}
              error={documentsQuery.error}
              onRetry={() => documentsQuery.refetch()}
              onUpload={() => openDocumentUpload()}
              onReupload={openDocumentUpload}
              onDelete={setDocumentToDelete}
              deletingDocumentId={
                deleteDocumentMutation.isPending
                  ? deleteDocumentMutation.variables
                  : null
              }
            />
          </TabsContent>
          <TabsContent value="assigned-assets" className="mt-4">
            <AssignedAssetsTab />
          </TabsContent>
        </TabComp>
      </div>

      <Sheet open={sheetAction === "edit"} onOpenChange={(open) => !open && setSheetAction(null)}>
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
                currentProfileImage={
                  profile.profileImage?.medium
                  || profile.profileImage?.small
                  || profile.profileImage?.original
                  || ""
                }
                setProfileImage={updateProfileImage}
                errors={profileErrors}
                formError={profileFormError}
                onCancel={() => setSheetAction(null)}
                onSubmit={submitProfile}
                isPending={updateProfileMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={sheetAction === "bank"} onOpenChange={(open) => !open && setSheetAction(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{currentTitle[0]}</SheetTitle>
            <SheetDescription>{currentTitle[1]}</SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <BankingDetailsForm
              form={bankForm}
              errors={bankErrors}
              formError={bankFormError}
              hasExistingAccount={Boolean(
                paymentProfileQuery.data?.bankAccount?.accountNumberMasked
                || paymentProfileQuery.data?.bankAccount?.accountNumber
              )}
              onFieldChange={updateBankField}
              onSubmit={submitBankProfile}
              onCancel={() => setSheetAction(null)}
              isPending={savePaymentProfileMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog
        open={isDocumentUploadOpen}
        onOpenChange={(open) => {
          if (!uploadDocumentMutation.isPending) setIsDocumentUploadOpen(open);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-[620px]">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <div className="flex items-start gap-3 pr-8">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <CloudUpload className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold">
                  {documentUploadMode === "reupload" ? "Re-upload Document" : "Upload Document"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5">
                  {documentUploadMode === "reupload"
                    ? "Upload a replacement for admin approval. The rejected copy is removed after a successful upload."
                    : "Submit a document for admin approval."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DocumentUploadForm
            form={documentForm}
            errors={documentErrors}
            formError={documentFormError}
            onFieldChange={updateDocumentField}
            onSubmit={submitDocument}
            onCancel={() => setIsDocumentUploadOpen(false)}
            isPending={uploadDocumentMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(documentToDelete)}
        onOpenChange={(open) => {
          if (!open && !deleteDocumentMutation.isPending) setDocumentToDelete(null);
        }}
      >
        <DialogContent className="p-0 sm:max-w-[440px]">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <div className="flex items-start gap-3 pr-8">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold">Delete Document</DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5">
                  This permanently removes the document and its uploaded file.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="px-5 py-4">
            <p className="text-xs leading-5 text-foreground">
              Delete <span className="font-medium">{documentToDelete?.documentName || "this document"}</span>?
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2 border-t border-border px-5 py-4 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDocumentToDelete(null)}
              disabled={deleteDocumentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="gap-2"
              onClick={() => deleteDocumentMutation.mutate(documentToDelete._id)}
              disabled={deleteDocumentMutation.isPending}
            >
              {deleteDocumentMutation.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Trash2 className="h-4 w-4" />}
              {deleteDocumentMutation.isPending ? "Deleting" : "Delete Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={sheetAction === "password"}
        onOpenChange={(open) => {
          if (!open && !changePasswordMutation.isPending) setSheetAction(null);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-[480px]">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <div className="flex items-start gap-3 pr-8">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle className="text-base font-semibold">Change Password</DialogTitle>
                <DialogDescription className="mt-1 text-xs leading-5">
                  Enter your current password and choose a new password for your account.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <PasswordForm
            form={passwordForm}
            errors={passwordErrors}
            formError={passwordFormError}
            onFieldChange={updatePasswordField}
            onSubmit={submitPassword}
            onCancel={() => setSheetAction(null)}
            isPending={changePasswordMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfileEditForm({
  form,
  updateField,
  updateEmergencyField,
  profileImage,
  currentProfileImage,
  setProfileImage,
  errors,
  formError,
  onSubmit,
  onCancel,
  isPending,
}) {
  const [profileImagePreview, setProfileImagePreview] = useState(currentProfileImage);

  useEffect(() => {
    if (!profileImage) {
      setProfileImagePreview(currentProfileImage);
      return undefined;
    }

    const previewUrl = URL.createObjectURL(profileImage);
    setProfileImagePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [currentProfileImage, profileImage]);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {formError && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-border p-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
            {profileImagePreview ? (
              <img
                src={profileImagePreview}
                alt={`${form.name || "Employee"} profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xl font-medium text-muted-foreground">
                {String(form.name || "E").trim().charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">Profile Image</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {profileImage ? "New image selected. It will be uploaded when you save." : "Current employee profile image."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Label
                htmlFor="profile-image-upload"
                className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border bg-background px-3 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground ${
                  errors.profileImage ? "border-destructive text-destructive" : "border-border text-foreground"
                }`}
              >
                <Camera className="h-4 w-4" />
                {profileImage ? "Choose Another Image" : "Upload New Image"}
              </Label>
              {profileImage && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setProfileImage(null)}>
                  Remove Selection
                </Button>
              )}
            </div>
          </div>
        </div>
        <Input
          key={profileImage ? `${profileImage.name}-${profileImage.size}-${profileImage.lastModified}` : "empty-profile-image"}
          id="profile-image-upload"
          className="sr-only"
          type="file"
          accept=".png,.jpg,.jpeg,.heif,.heic,image/png,image/jpeg,image/heif,image/heic"
          onChange={(event) => setProfileImage(event.target.files?.[0] || null)}
        />
        {profileImage && <p className="mt-3 truncate text-xs text-muted-foreground">{profileImage.name}</p>}
        <p className={`mt-2 text-[11px] ${errors.profileImage ? "text-destructive" : "text-muted-foreground"}`}>
          {errors.profileImage || "PNG, JPG, JPEG, HEIF or HEIC. Maximum file size: 5 MB."}
        </p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-foreground">Personal Details</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Full Name"
            value={form.name}
            error={errors.name}
            required
            maxLength={200}
            onChange={(value) => updateField("name", value)}
          />
          <FormField
            label="Phone Number"
            value={form.phoneNumber}
            error={errors.phoneNumber}
            required
            maxLength={10}
            inputMode="numeric"
            placeholder="9876543210"
            onChange={(value) => updateField("phoneNumber", value.replace(/\D/g, "").slice(0, 10))}
          />
          <FormField
            label="Date of Birth"
            type="date"
            value={form.dateOfBirth}
            error={errors.dateOfBirth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(value) => updateField("dateOfBirth", value)}
          />
          <ProfileSelectField
            label="Gender"
            value={form.gender}
            options={profileGenderOptions}
            error={errors.gender}
            placeholder="Select gender"
            onChange={(value) => updateField("gender", value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-3 text-sm font-medium text-foreground">Address</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            label="Address Line 1"
            value={form.addressLine1}
            error={errors.addressLine1}
            maxLength={300}
            onChange={(value) => updateField("addressLine1", value)}
          />
          <FormField
            label="Address Line 2"
            value={form.addressLine2}
            error={errors.addressLine2}
            maxLength={300}
            onChange={(value) => updateField("addressLine2", value)}
          />
          <FormField
            label="City"
            value={form.city}
            error={errors.city}
            maxLength={100}
            onChange={(value) => updateField("city", value)}
          />
          <ProfileSelectField
            label="State"
            value={form.state}
            options={profileStateOptions}
            error={errors.state}
            placeholder="Select state"
            onChange={(value) => updateField("state", value)}
          />
          <FormField
            label="PIN Code"
            value={form.pincode}
            error={errors.pincode}
            maxLength={6}
            inputMode="numeric"
            placeholder="302001"
            onChange={(value) => updateField("pincode", value.replace(/\D/g, "").slice(0, 6))}
          />
          <FormField
            label="Country"
            value={form.country}
            error={errors.country}
            maxLength={100}
            placeholder="India"
            onChange={(value) => updateField("country", value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border p-3">
        <p className="mb-3 text-sm font-medium text-foreground">Emergency Contact</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            id="emergency-contact-name"
            label="Contact Name"
            value={form.emergencyContact?.name}
            error={errors.emergencyName}
            maxLength={150}
            onChange={(value) => updateEmergencyField("name", value)}
          />
          <FormField
            id="emergency-contact-phone"
            label="Phone Number"
            value={form.emergencyContact?.phoneNumber}
            error={errors.emergencyPhoneNumber}
            maxLength={10}
            inputMode="numeric"
            placeholder="9876543211"
            onChange={(value) => updateEmergencyField("phoneNumber", value.replace(/\D/g, "").slice(0, 10))}
          />
          <FormField
            id="emergency-contact-relationship"
            label="Relationship"
            value={form.emergencyContact?.relationship}
            error={errors.emergencyRelationship}
            maxLength={100}
            placeholder="Sibling"
            onChange={(value) => updateEmergencyField("relationship", value)}
          />
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

function DocumentUploadForm({
  form,
  errors,
  formError,
  onFieldChange,
  onSubmit,
  onCancel,
  isPending,
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const selectFile = (file) => {
    if (file) onFieldChange("file", file);
  };

  return (
    <form
      noValidate
      className="space-y-5 px-5 pb-5 pt-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {formError && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfileSelectField
          label="Document Type"
          value={form.documentType}
          options={employeeDocumentTypes}
          error={errors.documentType}
          required
          placeholder="Select document type"
          onChange={(value) => onFieldChange("documentType", value)}
        />
        <FormField
          label="Document Name"
          value={form.documentName}
          error={errors.documentName}
          required
          maxLength={200}
          placeholder="Enter document name"
          onChange={(value) => onFieldChange("documentName", value)}
        />
        <FormField
          label="Document Number (Optional)"
          value={form.documentNumber}
          error={errors.documentNumber}
          maxLength={200}
          placeholder="Enter document number"
          onChange={(value) => onFieldChange("documentNumber", value)}
        />
        <FormField
          label="Issue Date (Optional)"
          value={form.issuedAt}
          error={errors.issuedAt}
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          onChange={(value) => onFieldChange("issuedAt", value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-foreground">
          Upload File<span className="ml-0.5 text-destructive">*</span>
        </Label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        <button
          type="button"
          className={`profile-document-dropzone ${isDragging ? "profile-document-dropzone-active" : ""} ${errors.file ? "border-destructive" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            selectFile(event.dataTransfer.files?.[0]);
          }}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-primary/10 text-primary">
            {form.file
              ? <FileText className="h-5 w-5" aria-hidden="true" />
              : <CloudUpload className="h-6 w-6" aria-hidden="true" />}
          </span>
          {form.file ? (
            <>
              <span className="mt-2 max-w-full truncate text-xs font-medium text-foreground">{form.file.name}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">
                {(form.file.size / (1024 * 1024)).toFixed(2)} MB · Click or drop to replace
              </span>
            </>
          ) : (
            <>
              <span className="mt-2 text-xs font-medium text-foreground">
                Drag &amp; drop your file here, or <span className="text-primary">click to browse</span>
              </span>
              <span className="mt-1 text-[10px] text-muted-foreground">PDF, JPG, PNG up to 10 MB</span>
            </>
          )}
        </button>
        {errors.file && <p className="text-[11px] leading-4 text-destructive">{errors.file}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="document-notes" className="text-xs font-medium text-foreground">Notes / Remark (Optional)</Label>
        <Textarea
          id="document-notes"
          value={form.notes}
          maxLength={1000}
          rows={3}
          placeholder="Add any additional notes or remarks..."
          aria-invalid={Boolean(errors.notes)}
          onChange={(event) => onFieldChange("notes", event.target.value)}
          className={`min-h-20 resize-y rounded-md text-xs crm-input ${errors.notes ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        {errors.notes && <p className="text-[11px] leading-4 text-destructive">{errors.notes}</p>}
      </div>

      <div className="profile-document-upload-notice">
        <Info className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          After upload, the document will be reviewed by admin.
          <span className="block">Approved documents become view-only.</span>
        </p>
      </div>

      <DialogFooter className="gap-2 pt-1 sm:space-x-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" className="gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
          {isPending ? "Uploading" : "Upload Document"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function BankingDetailsForm({
  form,
  errors,
  formError,
  hasExistingAccount,
  onFieldChange,
  onSubmit,
  onCancel,
  isPending,
}) {
  return (
    <form
      noValidate
      className="space-y-5 px-5 pb-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {formError && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <p className="text-xs font-medium text-foreground">Finance verification</p>
        <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
          Saving changes sends the payment profile back to Finance for verification.
        </p>
      </div>

      <ProfileSelectField
        label="Preferred Payment Mode"
        value={form.preferredPaymentMode}
        options={paymentModeOptions}
        onChange={(value) => onFieldChange("preferredPaymentMode", value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Account Holder Name"
          value={form.accountHolderName}
          error={errors.accountHolderName}
          required
          maxLength={150}
          onChange={(value) => onFieldChange("accountHolderName", value)}
        />
        <FormField
          label="Bank Name"
          value={form.bankName}
          error={errors.bankName}
          required
          maxLength={150}
          onChange={(value) => onFieldChange("bankName", value)}
        />
        <FormField
          label="Account Number"
          value={form.accountNumber}
          error={errors.accountNumber}
          required={!hasExistingAccount}
          inputMode="numeric"
          maxLength={18}
          placeholder={hasExistingAccount ? "Enter only to change account" : "Enter account number"}
          onChange={(value) => onFieldChange("accountNumber", value.replace(/\D/g, "").slice(0, 18))}
        />
        <FormField
          label="IFSC Code"
          value={form.ifscCode}
          error={errors.ifscCode}
          required
          maxLength={11}
          placeholder="e.g. SBIN0001234"
          onChange={(value) => onFieldChange("ifscCode", value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 11))}
        />
        <FormField
          label="Branch Name"
          value={form.branchName}
          error={errors.branchName}
          required
          maxLength={150}
          onChange={(value) => onFieldChange("branchName", value)}
        />
        <FormField
          label="UPI ID"
          value={form.upiId}
          error={errors.upiId}
          required={form.preferredPaymentMode === "UPI"}
          maxLength={320}
          placeholder="name@bank"
          onChange={(value) => onFieldChange("upiId", value)}
        />
      </div>

      {hasExistingAccount && (
        <p className="text-[11px] leading-4 text-muted-foreground">
          The saved account number is masked for security. Leave this field empty to keep the existing account.
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="h-10" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" className="h-10 gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Saving Details" : "Save Banking Details"}
        </Button>
      </div>
    </form>
  );
}

function PasswordForm({ form, errors, formError, onFieldChange, onSubmit, onCancel, isPending }) {
  return (
    <form
      noValidate
      className="space-y-4 px-5 pb-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {formError && (
        <Alert variant="destructive" className="py-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">{formError}</AlertDescription>
        </Alert>
      )}

      <PasswordField
        id="current-password"
        label="Current Password"
        value={form.currentPassword}
        error={errors.currentPassword}
        autoComplete="current-password"
        onChange={(value) => onFieldChange("currentPassword", value)}
      />
      <PasswordField
        id="new-password"
        label="New Password"
        value={form.newPassword}
        error={errors.newPassword}
        autoComplete="new-password"
        hint="Use 8–128 characters. Your new password must differ from the current one."
        onChange={(value) => onFieldChange("newPassword", value)}
      />
      <PasswordField
        id="confirm-password"
        label="Confirm New Password"
        value={form.confirmPassword}
        error={errors.confirmPassword}
        autoComplete="new-password"
        onChange={(value) => onFieldChange("confirmPassword", value)}
      />

      <DialogFooter className="gap-2 pt-1 sm:space-x-0">
        <Button type="button" variant="outline" className="h-10" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" className="h-10 gap-2" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />}
          {isPending ? "Changing Password" : "Change Password"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function PasswordField({ id, label, value, error, hint, autoComplete, onChange }) {
  const [isVisible, setIsVisible] = useState(false);
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          minLength={8}
          maxLength={128}
          required
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={(error || hint) ? descriptionId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`h-10 rounded-md pr-10 text-xs ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:bg-transparent hover:text-foreground"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      {(error || hint) && (
        <p id={descriptionId} className={`text-[11px] leading-4 ${error ? "text-destructive" : "text-muted-foreground"}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

function ProfileSelectField({ label, value, options, error, required = false, placeholder, onChange }) {
  const id = label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          className={`h-10 rounded-md text-xs crm-input ${error ? "border-destructive focus:ring-destructive" : ""}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>{option}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-[11px] leading-4 text-destructive">{error}</p>}
    </div>
  );
}

function FormField({
  id: providedId,
  label,
  value,
  onChange,
  error,
  type = "text",
  required = false,
  maxLength,
  inputMode,
  placeholder,
  max,
}) {
  const id = providedId || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value || ""}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        placeholder={placeholder}
        max={max}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={`h-10 rounded-md text-xs crm-input ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
      />
      {error && <p id={`${id}-error`} className="text-[11px] leading-4 text-destructive">{error}</p>}
    </div>
  );
}
