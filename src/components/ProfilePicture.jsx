import React from 'react';

const ProfilePicture = () => {
  return (
    <div className="rounded-full overflow-hidden w-64 h-64 mx-auto shadow-lg border-4 border-black dark:border-white">
      <div className="rounded-full overflow-hidden w-full h-full border-4 border-gray-300 dark:border-gray-700">
        <div className="rounded-full overflow-hidden w-full h-full border-4 border-black dark:border-white">
          <img
            src="/images/arnab-bir-profile.jpg"
            alt="Arnab Bir"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePicture;