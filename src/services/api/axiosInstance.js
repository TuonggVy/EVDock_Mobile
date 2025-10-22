import axios from "axios";

const api = axios.create({
  baseURL: "https://evm-project.onrender.com", 
});

export default api;
