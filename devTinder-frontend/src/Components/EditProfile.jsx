import React, { useState } from "react";
import UserCard from "./UserCard";
import axios from "../utils/axiosInstance";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";

const EditProfile = ({ user }) => {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [emailId, setEmailId] = useState(user.emailId || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [age, setAge] = useState(user.age || "");
  const [gender, setGender] = useState(user.gender || "");
  const [about, setAbout] = useState(user.about || "");
  const [skills, setSkills] = useState(user.skills?.join(",") || "");
  const [error, setError] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [uploading, setUploading] = useState(false);      // NEW
  const [uploadError, setUploadError] = useState("");     // NEW

  const dispatch = useDispatch();

  // ---------------------------
  // Photo Upload Handler (NEW)
  // ---------------------------
const handlePhotoUpload = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setUploadError("");
  setUploading(true);

  try {
    const formData = new FormData();
    formData.append("photo", file);

    const res = await axios.post(`${BASE_URL}/profile/photo`, formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data?.photoURL) {
      setPhotoURL(res.data.photoURL); // ✅ Local preview update
      dispatch(addUser(res.data.user)); // ✅ Update Redux immediately for Navbar
    } else {
      setUploadError("Upload succeeded but no URL returned.");
    }
  } catch (err) {
    console.error("Upload failed:", err);
    setUploadError(err?.response?.data || "Image upload failed.");
  } finally {
    setUploading(false);
    e.target.value = "";
  }
};


  // ---------------------------
  // Save Profile (existing)
  // ---------------------------
  const saveProfile = async () => {
    setError("");
    try {
      const res = await axios.post(
        BASE_URL + "/profile/edit",
        {
          firstName,
          lastName,
          emailId,
          photoURL, // may have come from upload
          age,
          gender,
          about,
          skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        },
        { withCredentials: true }
      );

      dispatch(addUser(res.data.data));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      setError(error?.response?.data || "Something went wrong");
    }
  };

  // ----------------------------------
  // Render
  // ----------------------------------
  return (
    <>
      <div className="flex flex-wrap justify-center gap-10 my-10">
        <div className="shadow-xl card bg-base-300 w-96">
          <div className="card-body">
            <h2 className="justify-center card-title">Edit Profile</h2>

            {/* First Name */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">First Name</span></div>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full max-w-xs input input-bordered"
              />
            </label>

            {/* Last Name */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">Last Name</span></div>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full max-w-xs input input-bordered"
              />
            </label>

            {/* Email */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">Email</span></div>
              <input
                type="email"
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                className="w-full max-w-xs input input-bordered"
              />
            </label>

            {/* Age */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">Age</span></div>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full max-w-xs input input-bordered"
                min="18"
              />
            </label>

            {/* Upload Photo (NEW) */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">Upload Profile Photo</span></div>
              <input
                type="file"
                accept="image/*"
                capture="user" // mobile selfie cam hint
                onChange={handlePhotoUpload}
                className="w-full max-w-xs file-input file-input-bordered"
              />
            </label>
            {uploading && (
              <p className="mt-1 text-sm text-info">Uploading photo...</p>
            )}
            {uploadError && (
              <p className="mt-1 text-sm text-error">{uploadError}</p>
            )}

            {/* PhotoURL manual override */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">Photo URL (optional)</span></div>
              <input
                type="text"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="Paste image URL (optional)"
                className="w-full max-w-xs input input-bordered"
              />
            </label>

            {/* Gender */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">Gender</span></div>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="select select-bordered"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Others">Others</option>
              </select>
            </label>

            {/* Skills */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">Skills (comma-separated)</span></div>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="w-full max-w-xs input input-bordered"
              />
            </label>

            {/* About */}
            <label className="w-full max-w-xs my-2 form-control">
              <div className="label"><span className="label-text">About</span></div>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                className="w-full max-w-xs textarea textarea-bordered"
                placeholder="Write about yourself..."
              ></textarea>
            </label>

            {/* Error + Save */}
            <p className="text-center text-red-500">{error}</p>
            <div className="justify-center mt-2 card-actions">
              <button className="btn btn-primary" onClick={saveProfile} disabled={uploading}>
                {uploading ? "Please wait..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <UserCard
          user={{
            _id: user._id,
            firstName,
            lastName,
            emailId,
            photoURL,
            about,
            age,
            gender,
            skills: [...new Set(skills.split(",").map((s) => s.trim()).filter(Boolean))],
          }}
        />
      </div>

      {showToast && (
        <div className="pt-20 toast toast-top toast-center">
          <div className="alert alert-success">
            <span>Profile saved successfully</span>
          </div>
        </div>
      )}
    </>
  );
};

export default EditProfile;
