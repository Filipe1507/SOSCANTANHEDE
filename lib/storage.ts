import * as ImageManipulator from "expo-image-manipulator";

export const uploadImage = async (uri: string): Promise<string> => {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  return `data:image/jpeg;base64,${manipulated.base64}`;
};