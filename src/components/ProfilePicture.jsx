import React from 'react';

const ProfilePicture = () => {
  return (
    <div className="rounded-full overflow-hidden w-64 h-64 mx-auto shadow-lg">
      <img
        src="/images/arnab-bir-profile.jpg"
        alt="Arnab Bir"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default ProfilePicture;