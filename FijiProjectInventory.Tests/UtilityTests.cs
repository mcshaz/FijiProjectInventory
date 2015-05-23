using System;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using FijiProjectInventory.Utilities;

namespace FijiProjectInventory.Tests
{
    [TestClass]
    public class UtilityTests
    {
        [TestMethod]
        public void TestMembersAreEqual()
        {
            Assert.IsTrue((new int[] { 3, -4, 7 }).MembersAreEqual(new int[] { 3, -4, 7 }));
            Assert.IsFalse((new int[] { 3, -4, 8 }).MembersAreEqual(new int[] { 3, -4, 7 }));
            Assert.IsFalse((new int[] { 3, -4, 7, 12 }).MembersAreEqual(new int[] { 3, -4, 7 }));
            Assert.IsFalse((new int[] { 3, -4, 7 }).MembersAreEqual(new int[] { 3, -4, 7, 12 }));
        }
        [TestMethod]
        public void TestMembersUniqueDescending()
        {
            Assert.IsTrue((new int[] { 6, 3, -1 }).MembersUniqueDescending());
            Assert.IsTrue((new int[0]).MembersUniqueDescending());
            Assert.IsTrue((new int[] { 6 }).MembersUniqueDescending());
            Assert.IsFalse((new int[] { 6, 3, 5, -1 }).MembersUniqueDescending());
            Assert.IsFalse((new int[] { 6, 3, 3, -1 }).MembersUniqueDescending());
        }
    }
}
