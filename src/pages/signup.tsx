import type {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextPage,
} from "next";
import NextLink from "next/link";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Center,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Link,
  Stack,
} from "@chakra-ui/react";
import { useState } from "react";
import { firestore } from "../firebase/firebase";
import Head from "next/head";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { getSession, signIn } from "next-auth/react";
import isAdminExists from "../utils/isAdminExists";

const SignupPage: NextPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  return (
    <>
      <Head>
        <title>Sign up | eBoto Mo</title>
      </Head>
      <Center height="80vh">
        <Container maxW="sm">
          <Center>
            <form
              style={{ width: "100%" }}
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                if (credentials.password !== credentials.confirmPassword) {
                  setError("Passwords do not match");
                  setLoading(false);
                  return;
                }

                // If user already exists, return error
                if (await isAdminExists(credentials.email)) {
                  setError("Admin already exists");
                  setLoading(false);
                  return;
                }

                // Create user docs
                const adminRef = await addDoc(collection(firestore, "admins"), {
                  accountType: "admin",
                  _id: uuidv4(),
                  email: credentials.email,
                  firstName: credentials.firstName
                    .trim()
                    .replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) =>
                      letter.toUpperCase()
                    ),
                  lastName: credentials.lastName
                    .trim()
                    .replace(/(^\w{1})|(\s+\w{1})/g, (letter: string) =>
                      letter.toUpperCase()
                    ),
                  password: credentials.password,
                  photoUrl: "",
                  elections: [],
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                  emailVerified: false,
                });
                // Update user's uid
                await setDoc(
                  doc(firestore, "admins", adminRef.id),
                  {
                    uid: adminRef.id,
                  },
                  { merge: true }
                ).then(async () => {
                  await signIn("credentials", {
                    email: credentials.email,
                    password: credentials.password,
                  });
                });
                setLoading(false);
              }}
            >
              <Stack width="100%" spacing={4}>
                <Stack>
                  <HStack>
                    <FormControl isRequired>
                      <FormLabel>First name</FormLabel>
                      <Input
                        autoFocus
                        placeholder="First name"
                        type="text"
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            firstName: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </FormControl>
                    <FormControl isRequired>
                      <FormLabel>Last name</FormLabel>
                      <Input
                        placeholder="Last name"
                        type="text"
                        onChange={(e) =>
                          setCredentials({
                            ...credentials,
                            lastName: e.target.value,
                          })
                        }
                        disabled={loading}
                      />
                    </FormControl>
                  </HStack>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      placeholder="Email"
                      type="email"
                      value={credentials.email}
                      onChange={(e) =>
                        setCredentials({
                          ...credentials,
                          email: e.target.value,
                        })
                      }
                      disabled={loading}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      placeholder="Password"
                      type="password"
                      minLength={8}
                      value={credentials.password}
                      onChange={(e) => {
                        setCredentials({
                          ...credentials,
                          password: e.target.value,
                        });
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Confirm password</FormLabel>
                    <Input
                      placeholder="Confirm password"
                      type="password"
                      minLength={8}
                      onChange={(e) => {
                        setCredentials({
                          ...credentials,
                          confirmPassword: e.target.value,
                        });
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  {error && (
                    <Alert status="error">
                      <AlertIcon />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <NextLink href="/signin" passHref>
                    <Link fontSize="xs">Already have an account?</Link>
                  </NextLink>
                </Stack>
                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={
                    !credentials.firstName ||
                    !credentials.lastName ||
                    !credentials.email ||
                    !credentials.password ||
                    !credentials.confirmPassword ||
                    credentials.password.length < 8 ||
                    credentials.confirmPassword.length < 8 ||
                    credentials.password !== credentials.confirmPassword ||
                    loading
                  }
                >
                  Signup
                </Button>
              </Stack>
            </form>
          </Center>
        </Container>
      </Center>
    </>
  );
};

export default SignupPage;

export const getServerSideProps: GetServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const session = await getSession(context);
  if (session && session.user.accountType === "voter") {
    const electionSnapshot = await getDoc(
      doc(firestore, "elections", session.user.election)
    );

    return {
      redirect: {
        destination: `/${electionSnapshot.data()?.electionIdName}`,
        permanent: false,
      },
    };
  } else if (session && session.user.accountType === "admin") {
    if (session.user.elections.length === 0) {
      return {
        redirect: {
          destination: "/create-election",
          permanent: false,
        },
      };
    }
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }
  return { props: {} };
};