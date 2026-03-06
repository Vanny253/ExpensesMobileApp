// AddExpense.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Button, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addExpense, addIncome } from "../../../api/expenseApi"; // <-- your API functions

const TransactionForm = ({ type }: { type: 'expense' | 'income' }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSubmit = async () => {
    if (!title || !amount || !category) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const data = {
      title,
      amount: parseFloat(amount),
      category,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
    };

    try {
      if (type === 'expense') {
        await addExpense(data);
        Alert.alert('Expense saved!', `Title: ${data.title}, Amount: ${data.amount}`);
      } else {
        await addIncome(data);
        Alert.alert('Income saved!', `Title: ${data.title}, Amount: ${data.amount}`);
      }

      // Clear form after submit
      setTitle('');
      setAmount('');
      setCategory('');
      setDate(new Date());
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', 'Failed to save data. Please try again.');
    }
  };

  const showDatePickerModal = () => setShowDatePicker(true);

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // keep open on iOS
    if (selectedDate) setDate(selectedDate);
  };

  // Example categories
  const categories = type === 'expense'
    ? ['Food', 'Transport', 'Shopping', 'Bills', 'Other']
    : ['Salary', 'Bonus', 'Gift', 'Investment', 'Other'];

  return (
    <View style={styles.formContainer}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder={`Enter ${type} title`}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder={`Enter ${type} amount`}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={category}
          onValueChange={(itemValue) => setCategory(itemValue)}
        >
          <Picker.Item label={`Select ${type} category`} value="" />
          {categories.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity onPress={showDatePickerModal} style={styles.dateButton}>
        <Text style={styles.dateText}>{date.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Button title={`Add ${type}`} onPress={handleSubmit} />
    </View>
  );
};

const AddExpenseScreen = () => {
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'expense' && styles.activeTab]}
          onPress={() => setActiveTab('expense')}
        >
          <Text style={[styles.tabText, activeTab === 'expense' && styles.activeTabText]}>Expense</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'income' && styles.activeTab]}
          onPress={() => setActiveTab('income')}
        >
          <Text style={[styles.tabText, activeTab === 'income' && styles.activeTabText]}>Income</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <TransactionForm type={activeTab} />
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    color: '#555',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  formContainer: {
    marginTop: 20,
  },
  label: {
    marginBottom: 5,
    fontWeight: 'bold',
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 15,
    borderRadius: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
  },
  dateButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
});

export default AddExpenseScreen;