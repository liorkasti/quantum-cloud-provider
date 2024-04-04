import { StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";

type Props = {};

const computersList = (props: Props) => {
  const [computers, setComputers] = useState([]);
  const [selectComputer, setSelectComputer] = useState("");
  const [isLoadonng, setIsLoading] = useState(false);

  const getComputers = async () => {
    try {
      const response = await axios.get("/computers");
      const data = await response.json;
      setComputers(data);
      console.log(computers);
    } catch (error) {
      console.error("error", error);
    }
  };
  return (
    <View>
      <Text>computersList</Text>
    </View>
  );
};

export default computersList;

const styles = StyleSheet.create({});
