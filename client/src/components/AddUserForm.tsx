import React, { useState, useEffect } from 'react';
import Button from 'plaid-threads/Button';
import TextInput from 'plaid-threads/TextInput';

import { useUsers, useCurrentUser } from '../services';

interface Props {
  hideForm: () => void;
}
const AddUserForm: React.FC<Props> = (props: Props) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const { addNewUser, getUsers } = useUsers();
  const { setNewUser } = useCurrentUser();
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await addNewUser(`${firstName} ${lastName}`);
    setNewUser(`${firstName} ${lastName}`);
    props.hideForm();
  };

  useEffect(() => {
    getUsers(true);
  }, [addNewUser, getUsers]);

  // all users must have first and last name for ach transfers
  return (
    <div className="box add-user__form">
      <form onSubmit={handleSubmit}>
        <div>
          <h3 className="heading add-user__heading">Create an account</h3>
          <div className="card">
            <div className="add-user__column-1">
              <TextInput
                id="firstName"
                name="firstName"
                required
                autoComplete="off"
                className="input_field"
                value={firstName}
                placeholder="First name"
                label="FirstName"
                onChange={e => setFirstName(e.target.value)}
              />
              <TextInput
                id="lastName"
                name="lastName"
                required
                autoComplete="off"
                className="input_field"
                value={lastName}
                placeholder="Last name"
                label="LastName"
                onChange={e => setLastName(e.target.value)}
              />
            </div>
            <div className="add-user__column-2">
              <Button className="add-user__button" centered small type="submit">
                Add User
              </Button>
              <Button
                className="add-user__button"
                centered
                small
                secondary
                onClick={props.hideForm}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

AddUserForm.displayName = 'AddUserForm';
export default AddUserForm;
