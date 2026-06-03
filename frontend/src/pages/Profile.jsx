import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, User, MapPin, Briefcase, GraduationCap, Shield, UserCircle, AlertCircle } from 'lucide-react';

const Profile = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    skills: '',
    post: '',
    roles: '',
    address: ''
  });
  
  // Local state for the displayed user to reflect immediate updates
  const [displayUser, setDisplayUser] = useState(user);

  // Sync displayUser if the context user changes (e.g. after initial load)
  useEffect(() => {
    if (user) {
      setDisplayUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (displayUser && displayUser.profile) {
      setProfileData({
        skills: displayUser.profile.skills || '',
        post: displayUser.profile.post || '',
        roles: displayUser.profile.roles || '',
        address: displayUser.profile.address || ''
      });
    }
  }, [displayUser]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTextChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setProfileData({ ...profileData, [name]: value });
  };

  const handleSave = async () => {
    try {
      const response = await axios.put('/users/profile', profileData);
      setDisplayUser(response.data);
      setUser(response.data); // Update AuthContext global user state
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update profile', err);
      alert('Failed to update profile');
    }
  };

  if (!displayUser) return null;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your account settings and preferences.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* User Identity Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="h-24 w-24 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center text-3xl font-bold text-gray-700 uppercase shrink-0">
                {displayUser?.username?.charAt(0) || '?'}
              </div>
              <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">{displayUser?.username || 'Unknown User'}</h2>
                    <p className="text-gray-500">{displayUser.email}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active Member
                  </span>
                </div>

                <div className="mt-6 bg-gray-50 rounded-lg p-4 border text-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-700 font-semibold">
                    <UserCircle className="h-4 w-4" />
                    Core Schema Details
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-600">
                    <p><span className="font-medium text-gray-900">ID:</span> {displayUser.id || displayUser._id}</p>
                    <p><span className="font-medium text-gray-900">Username:</span> {displayUser.username}</p>
                    <p><span className="font-medium text-gray-900">Email:</span> {displayUser.email}</p>
                    <p className="sm:col-span-2 break-all">
                      <span className="font-medium text-gray-900">Password Hash:</span>{' '}
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-red-600 select-all font-mono">
                        {displayUser.password || 'Not available'}
                      </code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Profile Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Professional Profile</CardTitle>
              <CardDescription>Your public professional information</CardDescription>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-2">
                  <Label>Primary Skill</Label>
                  <Select value={profileData.skills} onValueChange={(val) => handleSelectChange('skills', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a primary skill..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="React">React</SelectItem>
                      <SelectItem value="Node.js">Node.js</SelectItem>
                      <SelectItem value="Python">Python</SelectItem>
                      <SelectItem value="Java">Java</SelectItem>
                      <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Post / Position</Label>
                  <Select value={profileData.post} onValueChange={(val) => handleSelectChange('post', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a position..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Junior Developer">Junior Developer</SelectItem>
                      <SelectItem value="Senior Developer">Senior Developer</SelectItem>
                      <SelectItem value="Tech Lead">Tech Lead</SelectItem>
                      <SelectItem value="Product Manager">Product Manager</SelectItem>
                      <SelectItem value="Designer">Designer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Roles</Label>
                  <Select value={profileData.roles} onValueChange={(val) => handleSelectChange('roles', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Editor">Editor</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Super Admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Personal Address</Label>
                  <Input 
                    type="text" 
                    name="address" 
                    value={profileData.address} 
                    onChange={handleTextChange} 
                    placeholder="e.g. 123 Main St, City"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-gray-50 border flex items-start gap-3">
                  <div className="bg-white p-2 rounded border shadow-sm">
                    <GraduationCap className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Primary Skill</h3>
                    <p className="text-gray-600 mt-1">{displayUser.profile?.skills || 'Not specified'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border flex items-start gap-3">
                  <div className="bg-white p-2 rounded border shadow-sm">
                    <Briefcase className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Post / Position</h3>
                    <p className="text-gray-600 mt-1">{displayUser.profile?.post || 'Not specified'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border flex items-start gap-3">
                  <div className="bg-white p-2 rounded border shadow-sm">
                    <Shield className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Roles</h3>
                    <p className="text-gray-600 mt-1">{displayUser.profile?.roles || 'Not specified'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 border flex items-start gap-3">
                  <div className="bg-white p-2 rounded border shadow-sm">
                    <MapPin className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Personal Address</h3>
                    <p className="text-gray-600 mt-1">{displayUser.profile?.address || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;